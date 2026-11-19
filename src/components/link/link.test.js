import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './link.js';

contract('punica-link', { html: '<p>Read the <punica-link href="#guide">guide</punica-link> first.</p>' });
contract('punica-link', {
  html: '<punica-link href="https://example.com/" target="_blank" external>Example</punica-link>'
});

const anchor = (el) => el.shadowRoot.querySelector('a');

describe('punica-link', () => {
  afterEach(cleanup);

  it('is a native anchor that takes focus and carries href, target and download', async () => {
    const el = await fixture('<punica-link href="/files/a.pdf" download="a.pdf" target="files">File</punica-link>');
    const a = anchor(el);
    expect(a.getAttribute('href')).toBe('/files/a.pdf');
    expect(a.getAttribute('download')).toBe('a.pdf');
    expect(a.getAttribute('target')).toBe('files');
    expect(a.hasAttribute('rel')).toBe(false);
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(a);
    expect(el.matches(':focus')).toBe(true);
  });

  it('adds noopener for target=_blank and keeps what rel already says', async () => {
    const el = await fixture('<punica-link href="https://example.com/" target="_blank">x</punica-link>');
    expect(anchor(el).getAttribute('rel')).toBe('noopener');
    el.rel = 'nofollow';
    await settle();
    expect(anchor(el).getAttribute('rel')).toBe('nofollow noopener');
    el.rel = 'NoOpener noreferrer';
    await settle();
    expect(anchor(el).getAttribute('rel')).toBe('NoOpener noreferrer');
    el.target = null;
    el.rel = null;
    await settle();
    expect(anchor(el).hasAttribute('rel')).toBe(false);
  });

  it('follows a click to its href', async () => {
    const el = await fixture('<punica-link href="#punica-link-test">x</punica-link>');
    el.click();
    expect(location.hash).toBe('#punica-link-test');
    history.replaceState(null, '', location.pathname + location.search);
  });

  it('marks an external link with an icon and a hidden text', async () => {
    const el = await fixture('<punica-link href="https://example.com/" external>Example</punica-link>');
    const mark = el.shadowRoot.querySelector('.external');
    expect(mark.hidden).toBe(false);
    expect(mark.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(mark.querySelector('.hidden-text').textContent).toBe(' (external link)');
    expect(mark.querySelector('.hidden-text').getBoundingClientRect().width).toBe(1);
    el.labelExternal = 'dış bağlantı';
    await settle();
    expect(mark.querySelector('.hidden-text').textContent).toBe(' (dış bağlantı)');
    el.external = false;
    await settle();
    expect(mark.hidden).toBe(true);
    expect(getComputedStyle(mark).display).toBe('none');
  });

  it('goes nowhere and leaves the tab order when disabled', async () => {
    const el = await fixture('<punica-link href="#x" disabled>x</punica-link>');
    const a = anchor(el);
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.getAttribute('aria-disabled')).toBe('true');
    expect(a.getAttribute('role')).toBe('link');
    el.disabled = false;
    await settle();
    expect(a.getAttribute('href')).toBe('#x');
    expect(a.hasAttribute('aria-disabled')).toBe(false);
  });

  it('underlines always, on hover or never', async () => {
    const el = await fixture('<punica-link href="#x">x</punica-link>');
    expect(getComputedStyle(anchor(el)).textDecorationLine).toBe('underline');
    el.underline = 'none';
    await settle();
    expect(getComputedStyle(anchor(el)).textDecorationLine).toBe('none');
    el.underline = 'hover';
    await settle();
    expect(getComputedStyle(anchor(el)).textDecorationLine).toBe('none');
  });

  it('drops a script URL and treats every value as data', async () => {
    const el = await fixture('<punica-link href="javascript:alert(1)">x</punica-link>');
    expect(anchor(el).hasAttribute('href')).toBe(false);
    el.href = ' JaVaScRiPt:alert(1)';
    await settle();
    expect(anchor(el).hasAttribute('href')).toBe(false);
    const bad = '"><img src=x onerror=alert(1)>';
    el.href = bad;
    el.target = bad;
    el.rel = bad;
    el.labelExternal = bad;
    el.external = true;
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(anchor(el).getAttribute('href')).toBe(bad);
    expect(el.shadowRoot.querySelector('.hidden-text').textContent).toBe(` (${bad})`);
  });
});
