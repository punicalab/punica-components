import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import { qrMatrix } from './qrCode.js';

contract('punica-qr-code', { html: '<punica-qr-code value="https://example.com/" label="Link to example.com"></punica-qr-code>' });

/** The 7×7 finder pattern, dark ring, light ring, dark core. */
function isFinder(m, x0, y0) {
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
      if (m[y0 + y][x0 + x] !== (ring !== 2)) return false;
    }
  }
  return true;
}

/** Reads the 15 format bits beside the first finder and checks their BCH code. */
function format(m) {
  const cells = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  let info = 0;
  cells.forEach(([x, y], i) => (info |= (m[y][x] ? 1 : 0) << i));
  info ^= 0x5412;
  const value = info >>> 10;
  let remainder = value;
  for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  return { valid: (remainder & 0x3ff) === (info & 0x3ff), level: ['M', 'L', 'H', 'Q'][value >>> 3], mask: value & 7 };
}

/** Decodes a matrix with the platform's detector, or null when there is none. */
async function scan(matrix) {
  if (!('BarcodeDetector' in window)) return null;
  const scale = 8;
  const quiet = 4;
  const side = (matrix.length + quiet * 2) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, side, side);
  ctx.fillStyle = 'black';
  matrix.forEach((row, y) => row.forEach((dark, x) => dark && ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale)));
  try {
    const found = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(canvas);
    return found.map((f) => f.rawValue);
  } catch {
    return null;
  }
}

describe('qrMatrix', () => {
  it('builds a symbol of the right size with three finders, timing and a valid format', () => {
    for (const [text, level, version] of [
      ['HELLO', 'M', 1],
      ['https://example.com/', 'M', 2],
      ['https://example.com/', 'H', 3],
      ['x'.repeat(100), 'L', 5],
      ['x'.repeat(300), 'Q', 16]
    ]) {
      const m = qrMatrix(text, level);
      const size = version * 4 + 17;
      expect(m.length, text).toBe(size);
      expect(m.every((row) => row.length === size)).toBe(true);
      expect(isFinder(m, 0, 0) && isFinder(m, size - 7, 0) && isFinder(m, 0, size - 7)).toBe(true);
      for (let i = 8; i < size - 8; i++) {
        expect(m[6][i]).toBe(i % 2 === 0);
        expect(m[i][6]).toBe(i % 2 === 0);
      }
      expect(m[size - 8][8]).toBe(true);
      const f = format(m);
      expect(f.valid).toBe(true);
      expect(f.level).toBe(level);
    }
  });

  it('encodes UTF-8, falls back to M for an unknown level and gives up past version 40', () => {
    expect(qrMatrix('ğüşiöç').length).toBe(21);
    expect(qrMatrix('ğüşiöç €').length).toBe(25);
    expect(format(qrMatrix('a', 'nope')).level).toBe('M');
    expect(qrMatrix('x'.repeat(2953), 'L').length).toBe(177);
    expect(qrMatrix('x'.repeat(2954), 'L')).toBe(null);
  });

  it('is read back by the platform barcode detector, where there is one', async (ctx) => {
    const cases = [
      ['https://example.com/', 'M'],
      ['HELLO WORLD', 'H'],
      ['Merhaba dünya, ığüşöç', 'Q'],
      ['The quick brown fox jumps over the lazy dog. '.repeat(8), 'L'],
      ['z'.repeat(900), 'M']
    ];
    const first = await scan(qrMatrix(...cases[0]));
    if (first === null || first.length === 0) return ctx.skip();
    for (const [text, level] of cases) {
      expect(await scan(qrMatrix(text, level)), `${level} ${text.length}`).toEqual([text]);
    }
  });
});

describe('punica-qr-code', () => {
  afterEach(cleanup);

  it('draws the symbol as one SVG path inside the shadow root, with a quiet zone', async () => {
    const el = await fixture('<punica-qr-code value="https://example.com/"></punica-qr-code>');
    const svg = el.shadowRoot.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 33 33');
    const d = el.shadowRoot.querySelector('path').getAttribute('d');
    expect(d.startsWith('M4 4h7v1h-7z')).toBe(true);
    expect(el.shadowRoot.querySelector('canvas')).toBe(null);
    const box = el.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([128, 128]);
    expect(svg.getBoundingClientRect().width).toBe(128);
  });

  it('redraws for a new value or level and draws nothing without a value', async () => {
    const el = await fixture('<punica-qr-code value="a"></punica-qr-code>');
    const path = el.shadowRoot.querySelector('path');
    const first = path.getAttribute('d');
    el.value = 'b';
    await settle();
    expect(path.getAttribute('d')).not.toBe(first);
    const m = path.getAttribute('d');
    el.errorCorrection = 'h';
    await settle();
    expect(path.getAttribute('d')).not.toBe(m);
    el.value = null;
    await settle();
    expect(path.getAttribute('d')).toBe('');
    expect(el.matches(':state(empty)')).toBe(true);
    expect(el.internals.role).toBe(null);
  });

  it('is an image named by label, or by its value', async () => {
    const el = await fixture('<punica-qr-code value="https://example.com/"></punica-qr-code>');
    expect(el.internals.role).toBe('img');
    expect(el.internals.ariaLabel).toBe('https://example.com/');
    el.label = 'Link to example.com';
    await settle();
    expect(el.internals.ariaLabel).toBe('Link to example.com');
  });

  it('takes its size as a number and its colours from custom properties', async () => {
    const el = await fixture('<punica-qr-code value="a" size="200" style="--punica-qr-code-foreground: rgb(0, 0, 128)"></punica-qr-code>');
    expect(el.getBoundingClientRect().width).toBe(200);
    expect(getComputedStyle(el.shadowRoot.querySelector('path')).fill).toBe('rgb(0, 0, 128)');
    expect(getComputedStyle(el.shadowRoot.querySelector('rect')).fill).toBe('rgb(255, 255, 255)');
    for (const bad of ['10px;} * {display:none', '-5', '1e9', '"><img src=x onerror=alert(1)>']) {
      el.setAttribute('size', bad);
      await settle();
      expect(el.getBoundingClientRect().width, bad).toBe(128);
    }
  });

  it('encodes a hostile value as data and keeps one SVG across connects (1.x appended a canvas each time)', async () => {
    const el = await fixture('<punica-qr-code></punica-qr-code>');
    el.value = '"><img src=x onerror=alert(1)>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.shadowRoot.querySelector('path').getAttribute('d')).toMatch(/^[M0-9 hvz-]+$/);
    const parent = el.parentElement;
    el.remove();
    parent.appendChild(el);
    el.remove();
    parent.appendChild(el);
    expect(el.shadowRoot.querySelectorAll('svg').length).toBe(1);
  });
});
