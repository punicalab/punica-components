// Native parity: a Punica form control does in a form what its native
// counterpart does. Each case runs the same probe on the native control and
// on the Punica one and expects the same answer. Most bugs found while
// moving applications to 2.x were of this kind (a default not taken, an
// empty option that was no choice, a value set from script not submitted,
// a control out of the Tab order), so they are tested here side by side.
import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../src/index.js';
import { fixture, cleanup, settle } from './contract.js';

afterEach(cleanup);

/** The controls compared: a native one and its Punica counterpart. */
const PAIRS = {
  text: {
    native: (a = '') => `<input type="text" ${a}>`,
    punica: (a = '') => `<punica-input type="text" ${a}></punica-input>`
  },
  textarea: {
    native: (a = '', v = '') => `<textarea ${a}>${v}</textarea>`,
    punica: (a = '', v = '') =>
      `<punica-textarea ${a}${v ? ` value="${v}"` : ''}></punica-textarea>`
  },
  select: {
    native: (a = '', o = '') => `<select ${a}>${o}</select>`,
    punica: (a = '', o = '') =>
      `<punica-select ${a}>${o.replaceAll('<option', '<punica-option').replaceAll('</option>', '</punica-option>')}</punica-select>`
  },
  checkbox: {
    native: (a = '') => `<input type="checkbox" ${a}>`,
    punica: (a = '') => `<punica-checkbox ${a}>Agree</punica-checkbox>`
  },
  number: {
    native: (a = '') => `<input type="number" ${a}>`,
    punica: (a = '') => `<punica-number-input lang="en-US" ${a}></punica-number-input>`
  }
};

/**
 * Mounts `html` (holding one control, the first element with a name) in a
 * form, waits for it, and returns the form and the control.
 */
async function mount(html, { submit = true } = {}) {
  const form = await fixture(
    `<form lang="en-US">${html}${submit ? '<button type="submit">Go</button>' : ''}</form>`
  );
  form.addEventListener('submit', (e) => e.preventDefault());
  await settle();
  const control = form.querySelector('[name]');
  return { form, control };
}

/**
 * Runs `probe` on the native control and on the Punica one; the answers must
 * be the same.
 * @param {string} kind - a key of PAIRS
 * @param {(make: (typeof PAIRS)[keyof typeof PAIRS]['native']) => string} html
 * @param {(t: { form: HTMLFormElement, control: any }) => unknown} probe
 */
async function same(kind, html, probe) {
  const native = await probe(await mount(html(PAIRS[kind].native)));
  cleanup();
  const punica = await probe(await mount(html(PAIRS[kind].punica)));
  expect(punica, `${kind}: punica differs from native`).toEqual(native);
  return native;
}

const entries = (form) => [...new FormData(form).entries()].map(([k, v]) => [k, String(v)]);

const validity = (c) => ({
  valid: c.validity.valid,
  valueMissing: c.validity.valueMissing,
  customError: c.validity.customError,
  checkValidity: c.checkValidity()
});

describe('native parity: a value in its form', () => {
  for (const kind of ['text', 'textarea', 'number']) {
    it(`${kind}: the default value is submitted, and comes back on reset`, async () => {
      const value = kind === 'number' ? '7' : 'hello';
      const out = await same(
        kind,
        (make) => (kind === 'textarea' ? make('name="f"', value) : make(`name="f" value="${value}"`)),
        async ({ form, control }) => {
          const first = entries(form);
          control.value = kind === 'number' ? '9' : 'other';
          await settle();
          const changed = entries(form);
          form.reset();
          await settle();
          return { first, changed, reset: entries(form), value: String(control.value) };
        }
      );
      expect(out.first).toEqual([['f', value]]);
    });
  }

  it('checkbox: submits "on" without a value, its value when given one, nothing unchecked', async () => {
    await same('checkbox', (make) => make('name="a" checked') + make('name="b" value="yes" checked') + make('name="c"'), ({ form }) =>
      entries(form)
    );
  });

  it('checkbox: reset puts back the default checked state', async () => {
    await same('checkbox', (make) => make('name="a" checked'), async ({ form, control }) => {
      control.checked = false;
      await settle();
      const off = entries(form);
      form.reset();
      await settle();
      return { off, reset: entries(form), checked: control.checked };
    });
  });

  it('select: with no default and no placeholder, the first enabled option is the value', async () => {
    const out = await same(
      'select',
      (make) => make('name="s"', '<option value="a" disabled>A</option><option value="b">B</option><option value="c">C</option>'),
      ({ form, control }) => ({ data: entries(form), value: control.value })
    );
    expect(out.value).toBe('b');
  });

  it('select: the option marked selected is the default, and comes back on reset', async () => {
    await same(
      'select',
      (make) => make('name="s"', '<option value="a">A</option><option value="b" selected>B</option>'),
      async ({ form, control }) => {
        const first = control.value;
        control.value = 'a';
        await settle();
        form.reset();
        await settle();
        return { first, reset: control.value, data: entries(form) };
      }
    );
  });

  it('select: an option whose value is the empty string is a choice, and no answer when required', async () => {
    await same(
      'select',
      (make) => make('name="s" required', '<option value="">Any</option><option value="x">X</option>'),
      async ({ form, control }) => {
        const empty = { data: entries(form), ...validity(control) };
        control.value = 'x';
        await settle();
        return { empty, picked: { data: entries(form), ...validity(control) } };
      }
    );
  });
});

describe('native parity: constraints', () => {
  for (const kind of ['text', 'textarea', 'select', 'checkbox', 'number']) {
    it(`${kind}: required and empty is valueMissing, and the form is invalid`, async () => {
      const opts = kind === 'select' ? '<option value="">Pick</option><option value="a">A</option>' : '';
      await same(kind, (make) => make('name="f" required', opts), ({ form, control }) => ({
        ...validity(control),
        form: form.checkValidity()
      }));
    });

    it(`${kind}: setCustomValidity adds a customError with its message, and '' clears it`, async () => {
      const opts = kind === 'select' ? '<option value="a">A</option>' : '';
      await same(kind, (make) => make('name="f"', opts), async ({ control }) => {
        control.setCustomValidity('Taken.');
        await settle();
        const set = { ...validity(control), message: control.validationMessage };
        control.setCustomValidity('');
        await settle();
        return { set, cleared: validity(control) };
      });
    });

    it(`${kind}: a disabled control, or one in a disabled fieldset, is left out of the form`, async () => {
      const opts = kind === 'select' ? '<option value="a">A</option>' : '';
      const on = kind === 'checkbox' ? ' checked' : kind === 'select' ? '' : ' value="1"';
      await same(
        kind,
        (make) =>
          `${make(`name="own" disabled${on}`, opts)}<fieldset disabled>${make(`name="set"${on}`, opts)}</fieldset>`,
        ({ form }) => ({
          data: entries(form),
          disabled: [...form.querySelectorAll('[name]')].map((c) => c.matches(':disabled'))
        })
      );
    });
  }
});

describe('native parity: a form and its controls', () => {
  for (const kind of ['text', 'textarea', 'select', 'checkbox', 'number']) {
    it(`${kind}: is one of form.elements, by its name`, async () => {
      const opts = kind === 'select' ? '<option value="a">A</option>' : '';
      await same(kind, (make) => make('name="f"', opts), ({ form, control }) => ({
        listed: [...form.elements].includes(control),
        named: form.elements.namedItem('f') === control,
        form: control.form === form
      }));
    });

    // The one known difference (docs: guide, Forms): an assignment reaches ElementInternals at the end of the
    // microtask, so a script that submits in the same turn awaits `updateComplete` first. Reading `validity`,
    // `validationMessage` or `checkValidity()` of the control also brings it up to date.
    it(`${kind}: a value set from script is what a submit after updateComplete sends`, async () => {
      const opts = kind === 'select' ? '<option value="a">A</option><option value="b">B</option>' : '';
      const set = { text: 'x', textarea: 'x', select: 'b', number: '5' };
      await same(kind, (make) => make('name="f" required', opts), async ({ form, control }) => {
        let sent;
        form.addEventListener('submit', () => (sent = entries(form)), { once: true });
        if (kind === 'checkbox') control.checked = true;
        else control.value = set[kind];
        await control.updateComplete;
        form.requestSubmit();
        await settle();
        return sent;
      });
    });

    it(`${kind}: is in the Tab order, after the control before it`, async () => {
      const opts = kind === 'select' ? '<option value="a">A</option>' : '';
      await same(kind, (make) => `<button type="button" id="before">Before</button>${make('name="f"', opts)}`, async ({ form, control }) => {
        form.querySelector('#before').focus();
        await userEvent.tab();
        return { focused: document.activeElement === control, matches: control.matches(':focus') };
      });
    });
  }

  for (const kind of ['text', 'number']) {
    it(`${kind}: Enter in the field submits its form`, async () => {
      await same(kind, (make) => make('name="f" value="1"'), async ({ form, control }) => {
        let submitted = 0;
        form.addEventListener('submit', () => submitted++);
        control.focus();
        await userEvent.keyboard('{Enter}');
        await settle();
        return submitted;
      });
    });
  }

  it('textarea: Enter writes a new line and does not submit', async () => {
    await same('textarea', (make) => make('name="f"'), async ({ form, control }) => {
      let submitted = 0;
      form.addEventListener('submit', () => submitted++);
      control.focus();
      await userEvent.keyboard('a{Enter}b');
      await settle();
      return { submitted, value: control.value };
    });
  });
});

describe('native parity: buttons', () => {
  it('a submit button submits its form, and its name and value go with it', async () => {
    const run = async (html) => {
      const form = await fixture(`<form>${html}</form>`);
      let data;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        data = [...new FormData(form, e.submitter).entries()];
      });
      await settle();
      await userEvent.click(form.querySelector('[name="go"]'));
      await settle();
      cleanup();
      return data;
    };
    const native = await run('<button type="submit" name="go" value="post">Post</button>');
    const punica = await run('<punica-button type="submit" name="go" value="post">Post</punica-button>');
    expect(punica).toEqual(native);
  });

  it('a button is in the Tab order, a disabled one is not', async () => {
    const run = async (tag) => {
      const wrap = await fixture(
        `<div><button id="before">Before</button><${tag} id="off" disabled>Off</${tag}><${tag} id="on">On</${tag}></div>`
      );
      wrap.querySelector('#before').focus();
      await userEvent.tab();
      const id = document.activeElement?.id;
      cleanup();
      return id;
    };
    expect(await run('punica-button')).toBe(await run('button'));
  });
});
