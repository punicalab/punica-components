import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './lightbox.js';

const png = (color) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="${color}"/></svg>`)}`;
const html = `<punica-lightbox label="Holiday photos">
  <button id="t0"><img src="${png('red')}" alt="Beach" data-caption="The beach at noon"></button>
  <button id="t1"><img src="${png('green')}" alt="Forest"></button>
  <button id="t2"><img src="${png('blue')}" alt="Lake" data-caption="The lake"></button>
</punica-lightbox>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const native = (el) => el.shadowRoot.querySelector('dialog');
const $ = (el, selector) => el.shadowRoot.querySelector(selector);
const open = async (el) => {
  el.show();
  await settle();
};

contract('punica-lightbox', { html, open });

describe('punica-lightbox', () => {
  afterEach(cleanup);

  it('opens on the clicked thumbnail as a named modal dialog', async () => {
    const el = await fixture(html);
    const opened = once(el, 'punica-open');
    el.querySelector('#t1').click();
    await opened;
    await settle();
    const dialog = native(el);
    expect(dialog.matches(':modal')).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Holiday photos');
    expect(el.index).toBe(1);
    expect($(el, 'img').alt).toBe('Forest');
    expect($(el, 'img').getAttribute('src')).toBe(png('green'));
    expect($(el, '.counter').textContent).toBe('2 / 3');
    await wait(260);
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('steps with arrow keys, Home and End and fires punica-change with the index', async () => {
    const el = await fixture(html);
    el.querySelector('#t0').focus();
    await open(el);
    const seen = [];
    el.addEventListener('punica-change', (event) => seen.push(event.detail));
    await userEvent.keyboard('{ArrowRight}');
    await settle();
    expect($(el, 'img').alt).toBe('Forest');
    expect($(el, 'figcaption').textContent).toBe('');
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowLeft}');
    await userEvent.keyboard('{Home}');
    await userEvent.keyboard('{ArrowLeft}');
    await settle();
    expect(seen).toEqual([{ index: 1 }, { index: 2 }, { index: 1 }, { index: 0 }]);
    expect($(el, 'figcaption').textContent).toBe('The beach at noon');
    expect($(el, '.previous').getAttribute('aria-disabled')).toBe('true');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await closed).detail).toEqual({ reason: 'escape', returnValue: '' });
    expect(native(el).open).toBe(false);
    expect(document.activeElement).toBe(el.querySelector('#t0'));
  });

  it('names its buttons from the label attributes and steps on click', async () => {
    const el = await fixture(
      html.replace('<punica-lightbox', '<punica-lightbox label-previous="Önceki" label-next="Sonraki" label-close="Kapat"')
    );
    await open(el);
    expect($(el, '.previous').getAttribute('aria-label')).toBe('Önceki');
    expect($(el, '.next').getAttribute('aria-label')).toBe('Sonraki');
    expect($(el, '.close').getAttribute('aria-label')).toBe('Kapat');
    const changed = once(el, 'punica-change');
    $(el, '.next').click();
    expect((await changed).detail).toEqual({ index: 1 });
    const closed = once(el, 'punica-close');
    $(el, '.close').click();
    expect((await closed).detail.reason).toBe('close-button');
  });

  it('mirrors the arrow keys in right-to-left text', async () => {
    const wrap = await fixture(`<div dir="rtl">${html}</div>`);
    const el = wrap.querySelector('punica-lightbox');
    await open(el);
    await userEvent.keyboard('{ArrowLeft}');
    expect(el.index).toBe(1);
    await userEvent.keyboard('{ArrowRight}');
    expect(el.index).toBe(0);
  });

  it('shows the items property, with markup in a caption as text', async () => {
    const el = await fixture('<punica-lightbox label="Shots"></punica-lightbox>');
    el.items = [
      { src: png('red'), alt: 'One', caption: '<img src=x onerror="window.__lightboxXss = 1">' },
      { src: png('blue'), alt: '<b>Two</b>' }
    ];
    el.index = 0;
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    await open(el);
    expect(el.length).toBe(2);
    expect(el.shadowRoot.querySelectorAll('img').length).toBe(1);
    expect($(el, 'figcaption').textContent).toBe('<img src=x onerror="window.__lightboxXss = 1">');
    el.index = 1;
    await settle();
    expect($(el, 'img').alt).toBe('<b>Two</b>');
    expect($(el, '.counter').textContent).toBe('2 / 2');
    // A programmatic change fires nothing.
    expect(changes).toBe(0);
    await wait(20);
    expect(window.__lightboxXss).toBeUndefined();
  });

  it('closes on a click beside the image unless no-light-dismiss', async () => {
    const el = await fixture(html);
    await open(el);
    const click = () => {
      for (const type of ['pointerdown', 'click']) {
        native(el).dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, clientX: 3, clientY: 200 }));
      }
    };
    $(el, 'img').click();
    await settle();
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    click();
    expect((await closed).detail.reason).toBe('backdrop');
    el.noLightDismiss = true;
    await open(el);
    click();
    await settle();
    expect(el.open).toBe(true);
  });

  it('keeps two instances apart and adds nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll('punica-lightbox');
    await open(a);
    await open(b);
    expect(document.body.children.length).toBe(before + 1);
    await userEvent.keyboard('{ArrowRight}');
    expect(b.index).toBe(1);
    expect(a.index).toBe(0);
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(b.open).toBe(false);
    expect(a.open).toBe(true);
  });
});
