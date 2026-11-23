import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
  contract,
  fixture,
  cleanup,
  settle,
  once,
  a11y
} from '../../../test/contract.js';
import { deepActiveElement } from '../../core/a11y.js';
import './dialog.js';
import './dialogHeader.js';
import './dialogContent.js';
import './dialogFooter.js';

// The width a fixed panel spans: the visible viewport, without a scrollbar
// or the gutter the scroll lock keeps for one (Linux and Windows draw it in
// the page; macOS draws over it).
const viewportWidth = () =>
  Math.round(
    window.visualViewport?.width ?? document.documentElement.clientWidth
  );

const html = `<punica-dialog>
  <punica-dialog-header>Delete file</punica-dialog-header>
  <punica-dialog-content>This cannot be undone.</punica-dialog-content>
  <punica-dialog-footer><button id="cancel">Cancel</button><button id="ok">Delete</button></punica-dialog-footer>
</punica-dialog>`;
const page = `<div><button id="opener">Open</button>${html}</div>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const native = (el) => el.shadowRoot.querySelector('dialog');
const backdropClick = (el, x = 2, y = 2) => {
  for (const type of ['pointerdown', 'click']) {
    native(el).dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        composed: true,
        clientX: x,
        clientY: y
      })
    );
  }
};
const open = async (el) => {
  el.show();
  await settle();
};

for (const tag of [
  'punica-dialog',
  'punica-dialog-header',
  'punica-dialog-content',
  'punica-dialog-footer'
]) {
  contract(tag, { html, open });
}

describe('punica-dialog', () => {
  afterEach(cleanup);

  it('opens a modal native dialog named by its header', async () => {
    const el = await fixture(html);
    const opened = once(el, 'punica-open');
    el.open = true;
    await opened;
    const dialog = native(el);
    expect(dialog.open).toBe(true);
    expect(dialog.matches(':modal')).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Delete file');
    if ('ariaLabelledByElements' in dialog) {
      expect(dialog.ariaLabelledByElements).toEqual([
        el.querySelector('punica-dialog-header')
      ]);
    }
    expect(el.querySelector('punica-dialog-header').internals.role).toBe(
      'heading'
    );
    await wait(260);
    expect(await a11y(el.parentElement)).toEqual([]);
    el.label = 'Remove';
    await settle();
    expect(dialog.getAttribute('aria-label')).toBe('Remove');
  });

  it('opens from markup: the open attribute at connect does not throw', async () => {
    const el = await fixture(
      html.replace('<punica-dialog', '<punica-dialog open')
    );
    expect(native(el).matches(':modal')).toBe(true);
    const detached = document.createElement('punica-dialog');
    detached.open = true;
    detached.setAttribute('open', '');
    expect(native(detached).open).toBe(false);
  });

  it('moves focus in, keeps Tab inside, and returns focus to the opener', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-dialog');
    const opener = wrap.querySelector('#opener');
    opener.focus();
    await open(el);
    expect(document.activeElement).toBe(el.querySelector('#cancel'));
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(el.querySelector('#ok'));
    await userEvent.keyboard('{Tab}');
    expect(el.shadowRoot.activeElement).toBe(
      el.shadowRoot.querySelector('.close')
    );
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Tab}');
    expect(deepActiveElement()).not.toBe(opener);
    expect(
      el.contains(deepActiveElement()) ||
        el.shadowRoot.contains(deepActiveElement())
    ).toBe(true);
    el.hide();
    await settle();
    expect(document.activeElement).toBe(opener);
  });

  it("focuses the content's autofocus control, else its first control, also when the content scrolls", async () => {
    const rows = Array.from({ length: 40 }, (_, i) => `<p>Line ${i}</p>`).join(
      ''
    );
    const wrap = await fixture(
      `<div><punica-dialog label="Long"><punica-dialog-content>${rows}<input id="a"><input id="b" autofocus></punica-dialog-content></punica-dialog></div>`
    );
    const el = wrap.querySelector('punica-dialog');
    await open(el);
    expect(document.activeElement).toBe(el.querySelector('#b'));
    el.hide();
    await settle();
    el.querySelector('#b').removeAttribute('autofocus');
    await open(el);
    expect(document.activeElement).toBe(el.querySelector('#a'));
  });

  it('closes on a real Escape, stays in sync and reports the reason', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-dialog');
    const opener = wrap.querySelector('#opener');
    opener.focus();
    await open(el);
    const asked = once(el, 'punica-request-close');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await asked).detail).toEqual({ reason: 'escape' });
    expect((await closed).detail).toEqual({
      reason: 'escape',
      returnValue: ''
    });
    expect(el.open).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
    expect(native(el).open).toBe(false);
    expect(document.activeElement).toBe(opener);
    // And it opens again.
    await open(el);
    expect(native(el).matches(':modal')).toBe(true);
  });

  it('stays open when punica-request-close is prevented', async () => {
    const el = await fixture(html);
    await open(el);
    let asks = 0;
    const keep = (event) => {
      asks++;
      event.preventDefault();
    };
    el.addEventListener('punica-request-close', keep);
    el.shadowRoot.querySelector('.close').click();
    backdropClick(el);
    native(el).dispatchEvent(new Event('cancel', { cancelable: true }));
    await settle();
    expect(asks).toBe(3);
    expect(el.open).toBe(true);
    expect(native(el).open).toBe(true);
    el.removeEventListener('punica-request-close', keep);
    // The platform closing the dialog by itself is followed.
    const closed = once(el, 'punica-close');
    native(el).close();
    await closed;
    expect(el.open).toBe(false);
  });

  it('closes from the close button, named by label-close', async () => {
    const el = await fixture(
      html.replace('<punica-dialog', '<punica-dialog label-close="Kapat"')
    );
    await open(el);
    const button = el.shadowRoot.querySelector('.close');
    expect(button.getAttribute('aria-label')).toBe('Kapat');
    const closed = once(el, 'punica-close');
    button.click();
    expect((await closed).detail.reason).toBe('close-button');
  });

  it('closes on a backdrop click unless no-light-dismiss, and not on a click inside', async () => {
    const el = await fixture(html);
    await open(el);
    const rect = native(el).getBoundingClientRect();
    backdropClick(el, rect.left + 5, rect.top + 5);
    el.querySelector('#ok').click();
    await settle();
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    backdropClick(el);
    expect((await closed).detail.reason).toBe('backdrop');
    el.noLightDismiss = true;
    await open(el);
    backdropClick(el);
    await settle();
    expect(el.open).toBe(true);
  });

  it('reports returnValue and fires nothing more than open and close for the API', async () => {
    const el = await fixture(html);
    const seen = [];
    for (const type of [
      'punica-open',
      'punica-request-close',
      'punica-close'
    ]) {
      el.addEventListener(type, (event) => seen.push([type, event.detail]));
    }
    await open(el);
    el.hide('deleted');
    await settle();
    expect(seen).toEqual([
      ['punica-open', null],
      ['punica-close', { reason: 'api', returnValue: 'deleted' }]
    ]);
    expect(el.returnValue).toBe('deleted');
  });

  it('opens without a backdrop when modeless, and Escape still closes it', async () => {
    const el = await fixture(
      html.replace('<punica-dialog', '<punica-dialog modeless')
    );
    await open(el);
    expect(native(el).open).toBe(true);
    expect(native(el).matches(':modal')).toBe(false);
    // In the top layer, so no sticky header or clipping ancestor covers it.
    expect(native(el).matches(':popover-open')).toBe(true);
    expect(getComputedStyle(native(el)).position).toBe('fixed');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await closed).detail.reason).toBe('escape');
    expect(native(el).matches(':popover-open')).toBe(false);
    expect(native(el).hasAttribute('popover')).toBe(false);
    // Opened again as a modal, it is not a popover.
    el.modeless = false;
    await open(el);
    expect(native(el).matches(':modal')).toBe(true);
    expect(native(el).hasAttribute('popover')).toBe(false);
  });

  it('applies size', async () => {
    const el = await fixture(
      html.replace('<punica-dialog', '<punica-dialog size="small"')
    );
    await open(el);
    expect(Math.round(native(el).getBoundingClientRect().width)).toBe(320);
    el.size = 'large';
    await settle();
    expect(Math.round(native(el).getBoundingClientRect().width)).toBe(
      Math.min(720, viewportWidth() - 32)
    );
  });

  it('keeps two open dialogs apart and adds nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll('punica-dialog');
    await open(a);
    await open(b);
    expect(document.body.children.length).toBe(before + 1);
    let closedA = 0;
    a.addEventListener('punica-close', () => closedA++);
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(b.open).toBe(false);
    expect(a.open).toBe(true);
    expect(closedA).toBe(0);
  });

  it('renders markup in label as text', async () => {
    const el = await fixture(html);
    el.label = '<img src=x onerror="window.__dialogXss = 1">';
    el.labelClose = '<img src=x onerror="window.__dialogXss = 1">';
    await open(el);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(native(el).getAttribute('aria-label')).toContain('<img');
    expect(window.__dialogXss).toBeUndefined();
  });

  it('survives removal while open and opens again when appended', async () => {
    const el = await fixture(html);
    const parent = el.parentElement;
    await open(el);
    el.remove();
    await settle();
    parent.appendChild(el);
    await settle();
    expect(el.open).toBe(true);
    expect(native(el).matches(':modal')).toBe(true);
  });

  it('leaves no punica-modal behind', () => {
    expect(customElements.get('punica-modal')).toBeUndefined();
  });

  it('locks page scroll while a modal is open, without touching html or body styles', async () => {
    const tall = document.createElement('div');
    tall.style.height = '3000px';
    document.body.appendChild(tall);
    try {
      const wrap = await fixture(
        `<div>${html}${html}${html.replace(
          '<punica-dialog',
          '<punica-dialog modeless'
        )}</div>`
      );
      const [a, b, modeless] = wrap.querySelectorAll('punica-dialog');
      const rootOverflow = () =>
        getComputedStyle(document.documentElement).overflowY;
      const before = rootOverflow();
      await open(modeless);
      expect(rootOverflow()).toBe(before);
      window.scrollTo(0, 120);
      await open(a);
      expect(rootOverflow()).toBe('hidden');
      // The page keeps its place and wheel or keys no longer move it.
      expect(window.scrollY).toBe(120);
      await open(b);
      a.hide();
      await settle();
      // The second modal still holds the lock.
      expect(rootOverflow()).toBe('hidden');
      b.remove();
      await settle();
      expect(rootOverflow()).toBe(before);
      expect(document.documentElement.getAttribute('style')).toBe(null);
      expect(document.body.style.overflow).toBe('');
      expect(
        getComputedStyle(a.querySelector('punica-dialog-content'))
          .overscrollBehaviorY
      ).toBe('contain');
    } finally {
      tall.remove();
      window.scrollTo(0, 0);
    }
  });

  it('keeps a scrollbar gutter only where the page had a scrollbar that took room', async () => {
    const gutter = () =>
      getComputedStyle(document.documentElement).scrollbarGutter;
    const takesRoom = () =>
      window.innerWidth - document.documentElement.clientWidth > 0;
    // A page that does not scroll: no gutter, or an empty strip opens at the edge.
    const el = await fixture(html);
    await open(el);
    expect(gutter()).toBe('auto');
    expect(viewportWidth()).toBe(window.innerWidth);
    el.hide();
    await settle();
    // A page that scrolls: the gutter keeps the scrollbar's width where it took
    // some (Linux, Windows), so the page does not shift; none where it is drawn
    // over the page (macOS).
    const tall = document.createElement('div');
    tall.style.height = '3000px';
    document.body.appendChild(tall);
    try {
      const had = takesRoom();
      await open(el);
      expect(gutter()).toBe(had ? 'stable' : 'auto');
      el.hide();
      await settle();
      expect(gutter()).toBe('auto');
    } finally {
      tall.remove();
    }
  });
});
