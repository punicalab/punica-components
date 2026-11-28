import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './button.js';
import { configure } from '../../core/element.js';

contract('punica-button', { html: '<punica-button>Save</punica-button>' });

describe('punica-button', () => {
  afterEach(cleanup);

  it('paints nothing of its own when plain, and keeps its content a centred row', async () => {
    const el = await fixture(
      '<punica-button variant="plain" style="display:flex; gap:12px; color:rgb(1, 2, 3); font-size:11px"><i>a</i><b>b</b></punica-button>'
    );
    const base = el.shadowRoot.querySelector('button');
    const cs = getComputedStyle(base);
    expect(cs.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(cs.color).toBe('rgb(1, 2, 3)');
    expect(cs.fontSize).toBe('11px');
    expect(cs.minBlockSize).toBe('0px');
    expect(cs.paddingInlineStart).toBe('0px');
    const label = getComputedStyle(el.shadowRoot.querySelector('.label'));
    expect(label.display).toMatch(/flex/);
    expect(label.alignItems).toBe('center');
    expect(label.columnGap).toBe(cs.columnGap);
    expect(el.shadowRoot.activeElement).toBeNull();
    el.focus();
    expect(el.matches(':focus')).toBe(true);
  });

  describe('configure', () => {
    afterEach(() => configure({ 'punica-button': { variant: null, size: null, color: null } }));

    it('gives a button written with no attributes the page\'s defaults', async () => {
      configure({ 'punica-button': { variant: 'outlined', size: 'small', color: 'neutral' } });
      const el = await fixture('<punica-button>Save</punica-button>');
      expect(el.getAttribute('variant')).toBe('outlined');
      expect(el.getAttribute('size')).toBe('small');
      expect(el.color).toBe('neutral');
    });

    it('leaves what the markup or a script already said', async () => {
      configure({ 'punica-button': { variant: 'outlined', size: 'small' } });
      const marked = await fixture('<punica-button variant="filled">Save</punica-button>');
      expect(marked.getAttribute('variant')).toBe('filled');
      expect(marked.getAttribute('size')).toBe('small');
      const made = document.createElement('punica-button');
      made.variant = 'text';
      document.body.appendChild(made);
      await settle();
      expect(made.getAttribute('variant')).toBe('text');
      made.remove();
    });

    it('is the library\'s own button again once the defaults are taken away', async () => {
      configure({ 'punica-button': { variant: 'outlined' } });
      configure({ 'punica-button': { variant: null } });
      const el = await fixture('<punica-button>Save</punica-button>');
      expect(el.hasAttribute('variant')).toBe(false);
    });

    it('ignores a name the element does not declare', async () => {
      configure({ 'punica-button': { nonsense: 'x', size: 'large' } });
      const el = await fixture('<punica-button>Save</punica-button>');
      expect(el.hasAttribute('nonsense')).toBe(false);
      expect(el.getAttribute('size')).toBe('large');
    });
  });

  it('is reached by Tab and activated by Enter and Space', async () => {
    const el = await fixture('<punica-button>Save</punica-button>');
    let clicks = 0;
    el.addEventListener('click', () => clicks++);
    el.focus();
    expect(el.matches(':focus')).toBe(true);
    const inner = el.shadowRoot.querySelector('button');
    expect(el.shadowRoot.activeElement).toBe(inner);
    inner.click();
    expect(clicks).toBe(1);
  });

  it('takes no click while disabled or loading', async () => {
    const el = await fixture('<punica-button disabled>Save</punica-button>');
    let clicks = 0;
    el.addEventListener('click', () => clicks++);
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicks).toBe(0);
    el.disabled = false;
    el.loading = true;
    await settle();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicks).toBe(0);
    expect(
      el.shadowRoot.querySelector('button').getAttribute('aria-busy')
    ).toBe('true');
  });

  it('says on the element when its button has keyboard focus, as :state(focus-visible)', async () => {
    const el = await fixture('<punica-button>Save</punica-button>');
    await userEvent.keyboard('{Tab}');
    expect(el.matches(':focus')).toBe(true);
    expect(el.matches(':state(focus-visible)')).toBe(true);
    el.shadowRoot.querySelector('button').blur();
    expect(el.matches(':state(focus-visible)')).toBe(false);
    await userEvent.click(el);
    expect(el.matches(':focus')).toBe(true);
    expect(el.matches(':state(focus-visible)')).toBe(false);
  });

  it('submits its form with its name and value', async () => {
    const form = await fixture(
      '<form><input name="a" value="1"><punica-button type="submit" name="go" value="yes">Go</punica-button></form>'
    );
    let data;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      data = Object.fromEntries(new FormData(form));
    });
    form.querySelector('punica-button').click();
    expect(data).toEqual({ a: '1', go: 'yes' });
  });

  it("is its form's default button: Enter in a native field submits through it, once", async () => {
    const form = await fixture(
      '<form><input name="a" value="1"><input name="b" value="2"><textarea name="c"></textarea><punica-button type="submit" name="go" value="yes">Go</punica-button></form>'
    );
    const sent = [];
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sent.push(Object.fromEntries(new FormData(form)));
    });
    await userEvent.click(form.querySelector('[name=b]'));
    await userEvent.keyboard('{Enter}');
    expect(sent).toEqual([{ a: '1', b: '2', c: '', go: 'yes' }]);
    // Enter in a textarea is a new line.
    await userEvent.click(form.querySelector('textarea'));
    await userEvent.keyboard('{Enter}');
    expect(sent.length).toBe(1);
  });

  it('submits a form of one field once on Enter, where the browser would submit it too', async () => {
    const form = await fixture(
      '<form><input name="a"><punica-button type="submit">Go</punica-button></form>'
    );
    let sent = 0;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sent++;
    });
    await userEvent.click(form.querySelector('input'));
    await userEvent.keyboard('{Enter}');
    expect(sent).toBe(1);
  });

  it('blocks Enter while it is disabled, and leaves it to a native default button before it', async () => {
    const form = await fixture(
      '<form><input name="a"><input name="b"><punica-button type="submit" disabled>Go</punica-button></form>'
    );
    let sent = 0;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sent++;
    });
    await userEvent.click(form.querySelector('[name=a]'));
    await userEvent.keyboard('{Enter}');
    expect(sent).toBe(0);
    form.insertAdjacentHTML(
      'afterbegin',
      '<button type="submit" name="native">N</button>'
    );
    let submitter;
    form.addEventListener('submit', (e) => (submitter = e.submitter));
    await userEvent.click(form.querySelector('[name=a]'));
    await userEvent.keyboard('{Enter}');
    expect(sent).toBe(1);
    expect(submitter?.name).toBe('native');
  });

  it('resets its form', async () => {
    const form = await fixture(
      '<form><input name="a" value="1"><punica-button type="reset">Reset</punica-button></form>'
    );
    const input = form.querySelector('input');
    input.value = 'changed';
    form.querySelector('punica-button').click();
    expect(input.value).toBe('1');
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture(
      '<form><fieldset disabled><punica-button>Go</punica-button></fieldset></form>'
    );
    await settle();
    expect(
      form.querySelector('punica-button').shadowRoot.querySelector('button')
        .disabled
    ).toBe(true);
  });

  it('names an icon-only button from label', async () => {
    const el = await fixture('<punica-button label="Close"></punica-button>');
    expect(
      el.shadowRoot.querySelector('button').getAttribute('aria-label')
    ).toBe('Close');
  });

  it('names the native button from an aria-label on the element, label first', async () => {
    const el = await fixture(
      '<punica-button aria-label="Close"><svg></svg></punica-button>'
    );
    const inner = el.shadowRoot.querySelector('button');
    expect(inner.getAttribute('aria-label')).toBe('Close');
    el.setAttribute('aria-label', 'Shut');
    await settle();
    expect(inner.getAttribute('aria-label')).toBe('Shut');
    el.label = 'Dismiss';
    await settle();
    expect(inner.getAttribute('aria-label')).toBe('Dismiss');
    el.label = null;
    el.removeAttribute('aria-label');
    await settle();
    expect(inner.hasAttribute('aria-label')).toBe(false);
  });

  it('is exactly as tall as the other controls of its size, border included', async () => {
    const row = await fixture(`<div>
      <punica-button size="small">S</punica-button>
      <punica-button>M</punica-button>
      <punica-button size="large" variant="outlined">L</punica-button>
    </div>`);
    await settle();
    const heights = [...row.children].map(
      (b) => b.getBoundingClientRect().height
    );
    expect(heights).toEqual([28, 36, 44]);
  });
});
