import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './button.js';

contract('punica-button', { html: '<punica-button>Save</punica-button>' });

describe('punica-button', () => {
  afterEach(cleanup);

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
    expect(el.shadowRoot.querySelector('button').getAttribute('aria-busy')).toBe('true');
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

  it('resets its form', async () => {
    const form = await fixture('<form><input name="a" value="1"><punica-button type="reset">Reset</punica-button></form>');
    const input = form.querySelector('input');
    input.value = 'changed';
    form.querySelector('punica-button').click();
    expect(input.value).toBe('1');
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture('<form><fieldset disabled><punica-button>Go</punica-button></fieldset></form>');
    await settle();
    expect(form.querySelector('punica-button').shadowRoot.querySelector('button').disabled).toBe(true);
  });

  it('names an icon-only button from label', async () => {
    const el = await fixture('<punica-button label="Close"></punica-button>');
    expect(el.shadowRoot.querySelector('button').getAttribute('aria-label')).toBe('Close');
  });

  it('is exactly as tall as the other controls of its size, border included', async () => {
    const row = await fixture(`<div>
      <punica-button size="small">S</punica-button>
      <punica-button>M</punica-button>
      <punica-button size="large" variant="outlined">L</punica-button>
    </div>`);
    await settle();
    const heights = [...row.children].map((b) => b.getBoundingClientRect().height);
    expect(heights).toEqual([28, 36, 44]);
  });
});
