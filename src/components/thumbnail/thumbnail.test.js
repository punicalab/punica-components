import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './thumbnail.js';

const good = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="teal"/></svg>')}`;
const bad = 'data:image/png;base64,bm90IGFuIGltYWdl';
const html = `<punica-thumbnail src="${good}" alt="Harbour at dawn" ratio="4/3"></punica-thumbnail>`;
const part = (el, name) => el.shadowRoot.querySelector(`[part="${name}"]`);
const states = (el) => ['loading', 'loaded', 'error'].filter((s) => el.matches(`:state(${s})`));

contract('punica-thumbnail', { html });

describe('punica-thumbnail', () => {
  afterEach(cleanup);

  it('shows the picture once loaded and fires punica-load', async () => {
    const el = document.createElement('punica-thumbnail');
    el.alt = 'Harbour at dawn';
    el.loading = 'eager';
    const loaded = once(el, 'punica-load');
    el.src = good;
    document.body.append(el);
    expect((await loaded).detail.src).toBe(good);
    expect(states(el)).toEqual(['loaded']);
    expect(getComputedStyle(part(el, 'skeleton')).display).toBe('none');
    expect(part(el, 'image').alt).toBe('Harbour at dawn');
    expect(await a11y(el)).toEqual([]);
    el.remove();
  });

  it('shimmers while a picture from the network is on its way', async () => {
    const el = document.createElement('punica-thumbnail');
    el.loading = 'eager';
    const failed = once(el, 'punica-error');
    el.src = '/__thumbnail-missing.png';
    document.body.append(el);
    await Promise.resolve();
    expect(states(el)).toEqual(['loading']);
    expect(getComputedStyle(part(el, 'skeleton')).display).toBe('block');
    expect(getComputedStyle(part(el, 'fallback')).display).toBe('none');
    await failed;
    expect(states(el)).toEqual(['error']);
    expect(getComputedStyle(part(el, 'skeleton')).display).toBe('none');
    el.remove();
  });

  it('shows the fallback carrying the text alternative on error, and fires punica-error', async () => {
    const el = document.createElement('punica-thumbnail');
    el.alt = 'Harbour at dawn';
    const failed = once(el, 'punica-error');
    el.src = bad;
    document.body.append(el);
    expect((await failed).detail).toEqual({ src: bad });
    expect(states(el)).toEqual(['error']);
    const fallback = part(el, 'fallback');
    expect(getComputedStyle(fallback).display).toBe('flex');
    expect(getComputedStyle(part(el, 'image')).display).toBe('none');
    expect(fallback.getAttribute('role')).toBe('img');
    expect(fallback.getAttribute('aria-label')).toBe('Harbour at dawn');
    expect(await a11y(el)).toEqual([]);
    el.remove();
  });

  it('with no src shows the fallback slot, hidden from assistive technology when decorative', async () => {
    const el = await fixture('<punica-thumbnail><span slot="fallback">PDF</span></punica-thumbnail>');
    expect(states(el)).toEqual(['error']);
    expect(part(el, 'fallback').getAttribute('aria-hidden')).toBe('true');
    expect(part(el, 'fallback').querySelector('slot').assignedElements()[0].textContent).toBe('PDF');
    expect(part(el, 'image').hasAttribute('src')).toBe(false);
    expect(part(el, 'image').alt).toBe('');
  });

  it('loads lazily by default', async () => {
    const el = await fixture(html);
    expect(part(el, 'image').loading).toBe('lazy');
    el.loading = 'eager';
    await settle();
    expect(part(el, 'image').loading).toBe('eager');
  });

  it('keeps the ratio and the size presets, and refuses a ratio that is not number/number', async () => {
    const el = await fixture(html.replace('ratio="4/3"', 'ratio="4/3" size="large"'));
    const box = () => part(el, 'base').getBoundingClientRect();
    expect(box().width).toBe(160);
    expect(box().height).toBe(120);
    el.size = 'small';
    el.ratio = '1/1;} * {display:none';
    await settle();
    expect(box().width).toBe(48);
    expect(box().height).toBe(48);
    el.size = null;
    el.ratio = '2';
    await settle();
    expect(box().width).toBe(96);
    expect(box().height).toBe(48);
    expect(el.hasAttribute('style')).toBe(false);
  });

  it('fits by cover or contain and rounds by radius', async () => {
    const el = await fixture(html);
    expect(getComputedStyle(part(el, 'image')).objectFit).toBe('cover');
    el.fit = 'contain';
    el.radius = 'full';
    await settle();
    expect(getComputedStyle(part(el, 'image')).objectFit).toBe('contain');
    expect(getComputedStyle(part(el, 'base')).borderTopLeftRadius).toBe('9999px');
    el.radius = 'none';
    await settle();
    expect(getComputedStyle(part(el, 'base')).borderTopLeftRadius).toBe('0px');
  });

  it('with href is a link named by the picture or by label, reachable by keyboard', async () => {
    const el = await fixture(html.replace('<punica-thumbnail', '<punica-thumbnail href="#photo-12"'));
    const link = part(el, 'base');
    expect(link.getAttribute('href')).toBe('#photo-12');
    link.focus();
    expect(el.shadowRoot.activeElement).toBe(link);
    expect(await a11y(el.parentElement)).toEqual([]);
    el.alt = '';
    el.label = 'Open photo 12';
    await settle();
    expect(link.getAttribute('aria-label')).toBe('Open photo 12');
    expect(await a11y(el.parentElement)).toEqual([]);
    el.href = null;
    await settle();
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.hasAttribute('aria-label')).toBe(false);
  });

  it('puts data on as attribute values, never as markup', async () => {
    const el = await fixture(html);
    const evil = '"><img src=x onerror="window.__pwned=1">';
    el.alt = evil;
    el.href = evil;
    el.label = evil;
    await settle();
    expect(el.shadowRoot.querySelectorAll('img')).toHaveLength(1);
    expect(part(el, 'image').alt).toBe(evil);
    expect(window.__pwned).toBeUndefined();
  });
});
