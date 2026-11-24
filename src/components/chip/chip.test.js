import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './chip.js';

contract('punica-chip', { html: '<punica-chip>Design</punica-chip>' });
contract('punica-chip', { html: '<punica-chip selectable selected removable>Design</punica-chip>' });

const base = (el) => el.shadowRoot.querySelector('.base');
const remove = (el) => el.shadowRoot.querySelector('.remove');

describe('punica-chip', () => {
  afterEach(cleanup);

  it('is plain text by default, with no button and nothing in the tab order', async () => {
    const el = await fixture('<punica-chip>Design</punica-chip>');
    expect(base(el).localName).toBe('span');
    expect(getComputedStyle(remove(el)).display).toBe('none');
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(null);
    const box = el.getBoundingClientRect();
    expect(box.height).toBe(32);
    expect(parseFloat(getComputedStyle(el).borderTopLeftRadius)).toBeGreaterThanOrEqual(16);
  });

  it('is a native toggle button when selectable', async () => {
    const el = await fixture('<punica-chip selectable>Design</punica-chip>');
    const button = base(el);
    expect(button.localName).toBe('button');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(button);
    const changed = once(el, 'punica-change');
    button.click();
    expect((await changed).detail).toEqual({ selected: true });
    expect(el.selected).toBe(true);
    await settle();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(el.matches(':state(selected)')).toBe(true);
    expect(getComputedStyle(el.shadowRoot.querySelector('.check')).display).not.toBe('none');
    const again = once(el, 'punica-change');
    button.click();
    expect((await again).detail).toEqual({ selected: false });
  });

  it('toggles from a click on its slotted text and fires nothing for a property change', async () => {
    const el = await fixture('<punica-chip selectable><b>Design</b></punica-chip>');
    let events = 0;
    el.addEventListener('punica-change', () => events++);
    el.querySelector('b').click();
    expect(el.selected).toBe(true);
    expect(events).toBe(1);
    el.selected = false;
    await settle();
    expect(events).toBe(1);
    expect(base(el).getAttribute('aria-pressed')).toBe('false');
  });

  it('goes back to plain text when selectable is removed, keeping its content', async () => {
    const el = await fixture('<punica-chip selectable selected>Design</punica-chip>');
    const count = el.shadowRoot.querySelectorAll('*').length;
    el.selectable = false;
    await settle();
    expect(base(el).localName).toBe('span');
    expect(el.matches(':state(selected)')).toBe(false);
    expect(el.shadowRoot.querySelectorAll('*').length).toBe(count);
    expect(el.shadowRoot.querySelector('slot:not([name])').assignedNodes()[0].textContent).toBe('Design');
  });

  it('shows a remove button named with label-remove and the chip text', async () => {
    const el = await fixture('<punica-chip removable>Design</punica-chip>');
    const button = remove(el);
    expect(getComputedStyle(button).display).not.toBe('none');
    expect(button.getAttribute('aria-label')).toBe('Remove Design');
    el.labelRemove = 'Kaldır';
    await settle();
    expect(button.getAttribute('aria-label')).toBe('Kaldır Design');
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(button);
  });

  it('fires punica-dismiss from the remove button and hides, unless prevented', async () => {
    const el = await fixture('<punica-chip removable selectable>Design</punica-chip>');
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    const fired = once(el, 'punica-dismiss');
    remove(el).click();
    const event = await fired;
    expect(event.detail).toEqual({});
    expect(event.cancelable).toBe(true);
    expect(el.hidden).toBe(true);
    expect(changes).toBe(0);

    const kept = await fixture('<punica-chip removable>Design</punica-chip>');
    kept.addEventListener('punica-dismiss', (e) => e.preventDefault());
    remove(kept).click();
    expect(kept.hidden).toBe(false);
  });

  it('dismisses with Delete or Backspace on the focused chip', async () => {
    for (const key of ['Delete', 'Backspace']) {
      const el = await fixture('<punica-chip removable selectable>Design</punica-chip>');
      let dismissed = 0;
      el.addEventListener('punica-dismiss', () => dismissed++);
      el.focus();
      base(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));
      expect(dismissed, key).toBe(1);
    }
    const plain = await fixture('<punica-chip selectable>Design</punica-chip>');
    let dismissed = 0;
    plain.addEventListener('punica-dismiss', () => dismissed++);
    base(plain).dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, composed: true }));
    expect(dismissed).toBe(0);
  });

  it('takes no click and no focus while disabled', async () => {
    const el = await fixture('<punica-chip selectable removable disabled>Design</punica-chip>');
    let events = 0;
    el.addEventListener('punica-change', () => events++);
    el.addEventListener('punica-dismiss', () => events++);
    expect(base(el).disabled).toBe(true);
    expect(remove(el).disabled).toBe(true);
    base(el).click();
    remove(el).click();
    el.querySelector?.('b')?.click();
    el.shadowRoot.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(events).toBe(0);
    expect(getComputedStyle(el).pointerEvents).toBe('none');
  });

  it('reads variant, size and color', async () => {
    const wrap = await fixture(
      '<div><punica-chip color="success">x</punica-chip><i style="color:var(--punica-color-success)"></i></div>'
    );
    const el = wrap.firstElementChild;
    const accent = getComputedStyle(wrap.lastElementChild).color;
    expect(getComputedStyle(el).backgroundColor).toBe(accent);
    el.style.transition = 'none';
    el.variant = 'outlined';
    el.size = 'small';
    await settle();
    const cs = getComputedStyle(el);
    expect(cs.color).toBe(accent);
    expect(cs.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(cs.borderTopWidth).toBe('1px');
    expect(el.getBoundingClientRect().height).toBe(24);
    el.color = 'red;} * {display:none';
    await settle();
    expect(getComputedStyle(el).display).toBe('inline-flex');
  });
});

describe('punica-chip soft', () => {
  afterEach(cleanup);

  it('is a tint of its colour under its shade, readable in light and dark for every colour', async () => {
    const colors = ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'neutral'];
    for (const scheme of ['light', 'dark']) {
      const wrap = await fixture(
        `<div style="color-scheme: ${scheme}; background: var(--punica-color-surface); padding: 8px">${colors.map((c) => `<punica-chip variant="soft" color="${c}">${c}</punica-chip>`).join('')}<i style="color: var(--punica-color-success-dark); background: var(--punica-color-success-light)"></i></div>`
      );
      const success = wrap.children[5];
      const probe = getComputedStyle(wrap.lastElementChild);
      expect(getComputedStyle(success).backgroundColor).toBe(probe.backgroundColor);
      expect(getComputedStyle(success).color).toBe(probe.color);
      expect(await a11y(wrap)).toEqual([]);
      cleanup();
    }
  });
});

describe('punica-chip disabled', () => {
  afterEach(cleanup);

  it('keeps the label of a disabled chip readable, in both variants', async () => {
    for (const variant of ['filled', 'outlined']) {
      const el = await fixture(`<punica-chip disabled removable variant="${variant}">Design</punica-chip>`);
      expect(getComputedStyle(el).opacity).toBe('1');
      expect(await a11y(el)).toEqual([]);
      cleanup();
    }
  });
});

describe('punica-chip neutral', () => {
  afterEach(cleanup);

  it('keeps its text readable on the neutral grey in light and dark', async () => {
    for (const scheme of ['light', 'dark']) {
      const wrap = await fixture(`<div style="color-scheme: ${scheme}; background: var(--punica-color-surface); padding: 8px"><punica-chip color="neutral">Design</punica-chip></div>`);
      expect(await a11y(wrap)).toEqual([]);
      cleanup();
    }
  });
});

describe('punica-chip selectable, filled', () => {
  afterEach(cleanup);

  it('draws off and on with different backgrounds, both readable', async () => {
    for (const color of ['primary', 'warning', 'neutral']) {
      const wrap = await fixture(
        `<div><punica-chip selectable color="${color}">Off</punica-chip><punica-chip selectable selected color="${color}">On</punica-chip></div>`
      );
      const [off, on] = wrap.children;
      expect(getComputedStyle(off).backgroundColor).not.toBe(getComputedStyle(on).backgroundColor);
      expect(await a11y(wrap)).toEqual([]);
      cleanup();
    }
  });
});
