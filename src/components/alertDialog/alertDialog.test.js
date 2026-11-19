import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import { deepActiveElement, composedContains } from '../../core/a11y.js';
import { confirm } from './alertDialog.js';

const html = `<punica-alert-dialog heading="Delete project?" confirm-label="Delete project" color="error">
  The project and its 12 files are removed for everyone. This cannot be undone.
</punica-alert-dialog>`;
const page = `<div><button id="opener">Delete</button>${html}</div>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const native = (el) => el.shadowRoot.querySelector('dialog');
const button = (el, name) => el.shadowRoot.querySelector(`.${name}`);
const open = async (el) => {
  el.show();
  await settle();
};

contract('punica-alert-dialog', { html, open });

describe('punica-alert-dialog', () => {
  afterEach(cleanup);

  it('is a modal alertdialog named by its heading and described by its content', async () => {
    const el = await fixture(html);
    await open(el);
    const dialog = native(el);
    expect(dialog.matches(':modal')).toBe(true);
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.getAttribute('aria-label')).toBe('Delete project?');
    const heading = el.shadowRoot.querySelector('h2');
    expect(heading.textContent).toBe('Delete project?');
    if ('ariaLabelledByElements' in dialog) expect(dialog.ariaLabelledByElements).toEqual([heading]);
    const described = el.shadowRoot.getElementById(dialog.getAttribute('aria-describedby'));
    expect(described.querySelector('slot').assignedNodes()[0].textContent).toContain('cannot be undone');
    await wait(260);
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('labels its buttons, defaults to Confirm and Cancel, and colours the confirm button', async () => {
    const el = await fixture('<punica-alert-dialog heading="Sign out?"></punica-alert-dialog>');
    expect(button(el, 'confirm').textContent).toBe('Confirm');
    expect(button(el, 'cancel').textContent).toBe('Cancel');
    expect(button(el, 'confirm').hasAttribute('color')).toBe(false);
    el.confirmLabel = 'Sign out';
    el.cancelLabel = 'Stay';
    el.color = 'error';
    await settle();
    expect(button(el, 'confirm').textContent).toBe('Sign out');
    expect(button(el, 'cancel').textContent).toBe('Stay');
    expect(button(el, 'confirm').getAttribute('color')).toBe('error');
  });

  it('puts focus on the cancel button, keeps it inside, and returns it to the opener', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-alert-dialog');
    const opener = wrap.querySelector('#opener');
    opener.focus();
    await open(el);
    expect(el.shadowRoot.activeElement).toBe(button(el, 'cancel'));
    await userEvent.keyboard('{Tab}');
    expect(el.shadowRoot.activeElement).toBe(button(el, 'confirm'));
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Tab}');
    expect(composedContains(native(el), deepActiveElement())).toBe(true);
    const closed = once(el, 'punica-close');
    button(el, 'cancel').click();
    expect((await closed).detail).toEqual({ reason: 'cancel', returnValue: 'cancel' });
    expect(document.activeElement).toBe(opener);
  });

  it('reports confirm, and Enter on the focused confirm button confirms', async () => {
    const el = await fixture(html);
    await open(el);
    const asked = once(el, 'punica-request-close');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Enter}');
    expect((await asked).detail).toEqual({ reason: 'confirm' });
    expect((await closed).detail).toEqual({ reason: 'confirm', returnValue: 'confirm' });
    expect(el.returnValue).toBe('confirm');
    expect(el.open).toBe(false);
  });

  it('Escape cancels with reason escape; the backdrop does nothing', async () => {
    const el = await fixture(html);
    await open(el);
    const rect = native(el).getBoundingClientRect();
    for (const type of ['pointerdown', 'click']) {
      native(el).dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, clientX: 2, clientY: 2 }));
    }
    await settle();
    expect(rect.left).toBeGreaterThan(2);
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await closed).detail.reason).toBe('escape');
    expect(native(el).open).toBe(false);
  });

  it('ask() resolves true on confirm and false on cancel, Escape and hide()', async () => {
    const el = await fixture(html);
    let answer = el.ask();
    await settle();
    expect(el.open).toBe(true);
    button(el, 'confirm').click();
    expect(await answer).toBe(true);

    answer = el.ask();
    await settle();
    button(el, 'cancel').click();
    expect(await answer).toBe(false);

    answer = el.ask();
    await settle();
    await userEvent.keyboard('{Escape}');
    expect(await answer).toBe(false);

    answer = el.ask();
    await settle();
    el.hide();
    expect(await answer).toBe(false);
  });

  it('stays open while punica-request-close is prevented and loading ignores the confirm button', async () => {
    const el = await fixture(html);
    const answer = el.ask();
    await settle();
    const hold = (event) => {
      if (event.detail.reason !== 'confirm') return;
      event.preventDefault();
      el.loading = true;
    };
    el.addEventListener('punica-request-close', hold);
    button(el, 'confirm').click();
    await settle();
    expect(el.open).toBe(true);
    expect(button(el, 'confirm').loading).toBe(true);
    el.removeEventListener('punica-request-close', hold);
    button(el, 'confirm').click();
    await settle();
    expect(el.open).toBe(true);
    el.loading = false;
    await settle();
    button(el, 'confirm').click();
    expect(await answer).toBe(true);
  });

  it('confirm() makes a dialog, resolves with the answer and removes it', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const answer = confirm({
      heading: 'Discard draft?',
      message: '<img src=x onerror="window.__pwned=1">',
      confirmLabel: 'Discard',
      color: 'error'
    });
    await settle();
    const el = document.body.querySelector('punica-alert-dialog');
    expect(el.open).toBe(true);
    expect(el.querySelector('img')).toBe(null);
    expect(el.textContent).toBe('<img src=x onerror="window.__pwned=1">');
    expect(el.shadowRoot.querySelector('h2').textContent).toBe('Discard draft?');
    expect(button(el, 'confirm').textContent).toBe('Discard');
    expect(button(el, 'confirm').getAttribute('color')).toBe('error');
    button(el, 'confirm').click();
    expect(await answer).toBe(true);
    expect(el.isConnected).toBe(false);
    expect(document.activeElement).toBe(opener);
    expect(window.__pwned).toBeUndefined();

    const second = confirm({ heading: 'Leave?' });
    await settle();
    await userEvent.keyboard('{Escape}');
    expect(await second).toBe(false);
    expect(document.body.querySelector('punica-alert-dialog')).toBe(null);
    opener.remove();
  });

  it('renders heading and labels as text', async () => {
    const bad = '<img src=x onerror="window.__pwned=1">';
    const el = await fixture('<punica-alert-dialog></punica-alert-dialog>');
    el.heading = bad;
    el.confirmLabel = bad;
    el.cancelLabel = bad;
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.shadowRoot.querySelector('h2').textContent).toBe(bad);
    expect(button(el, 'confirm').querySelector('img')).toBe(null);
  });

  it('with no heading, label names it and the empty heading is hidden', async () => {
    const el = await fixture('<punica-alert-dialog label="Confirm payment">Pay €40 now?</punica-alert-dialog>');
    await open(el);
    expect(native(el).getAttribute('aria-label')).toBe('Confirm payment');
    expect(el.shadowRoot.querySelector('h2').hidden).toBe(true);
  });
});
