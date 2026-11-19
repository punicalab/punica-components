import { PunicaElement, define } from '../../core/element.js';
import styles from './qrCode.css';

/* ------------------------------------------------------------------ encoder
 * QR Code Model 2 (ISO/IEC 18004), byte mode over UTF-8, versions 1 to 40.
 */

/** Error-correction codewords per block, by level then version. */
const ECC_PER_BLOCK = {
  L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
};

/** Number of error-correction blocks, by level then version. */
const BLOCKS = {
  L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
};

/** The two format bits of each level. */
const LEVEL_BITS = { L: 1, M: 0, Q: 3, H: 2 };

/** Modules left for data and error correction once function patterns are drawn. */
function rawModules(version) {
  let count = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    count -= (25 * align - 10) * align - 55;
    if (version >= 7) count -= 36;
  }
  return count;
}

const dataCodewords = (version, level) =>
  Math.floor(rawModules(version) / 8) - ECC_PER_BLOCK[level][version] * BLOCKS[level][version];

/** Product of two elements of GF(2^8) modulo x^8 + x^4 + x^3 + x^2 + 1. */
function multiply(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function reedSolomonDivisor(degree) {
  const result = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = multiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = multiply(root, 2);
  }
  return result;
}

function reedSolomonRemainder(data, divisor) {
  const result = divisor.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ result.shift();
    result.push(0);
    divisor.forEach((coefficient, i) => (result[i] ^= multiply(coefficient, factor)));
  }
  return result;
}

/** The data codewords with error correction appended, interleaved by block. */
function withErrorCorrection(data, version, level) {
  const blockCount = BLOCKS[level][version];
  const eccLength = ECC_PER_BLOCK[level][version];
  const raw = Math.floor(rawModules(version) / 8);
  const shortBlocks = blockCount - (raw % blockCount);
  const shortLength = Math.floor(raw / blockCount);
  const divisor = reedSolomonDivisor(eccLength);
  const blocks = [];
  for (let i = 0, k = 0; i < blockCount; i++) {
    const part = data.slice(k, k + shortLength - eccLength + (i < shortBlocks ? 0 : 1));
    k += part.length;
    const ecc = reedSolomonRemainder(part, divisor);
    if (i < shortBlocks) part.push(0);
    blocks.push(part.concat(ecc));
  }
  const result = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      // The padding byte of a short block is not part of the symbol.
      if (i !== shortLength - eccLength || j >= shortBlocks) result.push(block[i]);
    });
  }
  return result;
}

function alignmentPositions(version, size) {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let position = size - 7; result.length < count; position -= step) result.splice(1, 0, position);
  return result;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
];

const FINDER_LIKE = [
  [true, false, true, true, true, false, true, false, false, false, false],
  [false, false, false, false, true, false, true, true, true, false, true]
];

/** The standard's penalty score of a finished symbol; lower reads better. */
function penalty(modules) {
  const size = modules.length;
  let score = 0;
  const line = (get) => {
    let run = 1;
    for (let i = 1; i <= size; i++) {
      if (i < size && get(i) === get(i - 1)) run++;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    for (let i = 0; i + 11 <= size; i++) {
      for (const pattern of FINDER_LIKE) {
        if (pattern.every((dark, k) => get(i + k) === dark)) score += 40;
      }
    }
  };
  let dark = 0;
  for (let a = 0; a < size; a++) {
    line((i) => modules[a][i]);
    line((i) => modules[i][a]);
    for (let b = 0; b < size; b++) {
      if (modules[a][b]) dark++;
      if (a + 1 < size && b + 1 < size) {
        const colour = modules[a][b];
        if (colour === modules[a][b + 1] && colour === modules[a + 1][b] && colour === modules[a + 1][b + 1]) score += 3;
      }
    }
  }
  const total = size * size;
  score += Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10;
  return score;
}

/**
 * Encodes text as a QR Code symbol.
 *
 * @param {string} text encoded as UTF-8 bytes
 * @param {'L' | 'M' | 'Q' | 'H'} [level] error-correction level, `M` by default
 * @returns {boolean[][] | null} rows of modules, true for dark, without the
 *   quiet zone; null when the text does not fit the largest symbol
 */
export function qrMatrix(text, level = 'M') {
  if (!Object.hasOwn(LEVEL_BITS, level)) level = 'M';
  const bytes = [...new TextEncoder().encode(text)];

  let version = 1;
  for (; version <= 40; version++) {
    const countBits = version < 10 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= dataCodewords(version, level) * 8) break;
  }
  if (version > 40) return null;

  // Mode, count, data, terminator, then padding to the symbol's capacity.
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(4, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) push(byte, 8);
  const capacity = dataCodewords(version, level) * 8;
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let k = 0; k < 8; k++) byte = (byte << 1) | bits[i + k];
    data.push(byte);
  }
  const codewords = withErrorCorrection(data, version, level);

  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => {
    modules[y][x] = dark;
    reserved[y][x] = true;
  };

  // Timing patterns.
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  // Finder patterns with their separators.
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, distance !== 2 && distance !== 4);
      }
    }
  }
  // Alignment patterns, everywhere but on the finders.
  const align = alignmentPositions(version, size);
  const last = align.length - 1;
  align.forEach((cx, i) => {
    align.forEach((cy, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    });
  });
  // Version information, from version 7.
  if (version >= 7) {
    let remainder = version;
    for (let i = 0; i < 12; i++) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    const info = (version << 12) | remainder;
    for (let i = 0; i < 18; i++) {
      const dark = ((info >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, dark);
      set(b, a, dark);
    }
  }
  const drawFormat = (mask) => {
    const value = (LEVEL_BITS[level] << 3) | mask;
    let remainder = value;
    for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    const info = ((value << 10) | remainder) ^ 0x5412;
    const bit = (i) => ((info >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat(0);

  // Codewords, in the zigzag from the bottom corner at the inline end.
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vertical : vertical;
        if (!reserved[y][x] && index < codewords.length * 8) {
          modules[y][x] = ((codewords[index >>> 3] >>> (7 - (index & 7))) & 1) === 1;
          index++;
        }
      }
    }
  }

  const applyMask = (mask) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!reserved[y][x] && MASKS[mask](x, y)) modules[y][x] = !modules[y][x];
      }
    }
  };
  let best = 0;
  let lowest = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask);
    drawFormat(mask);
    const score = penalty(modules);
    if (score < lowest) {
      lowest = score;
      best = mask;
    }
    applyMask(mask);
  }
  applyMask(best);
  drawFormat(best);
  return modules;
}

/* ------------------------------------------------------------------ element */

/** Light modules the standard asks for around the symbol. */
const QUIET = 4;

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/**
 * A QR code of a text or a URL, drawn as SVG.
 *
 * @element punica-qr-code
 *
 * @attr {string} value - The text to encode, as UTF-8. Nothing is drawn while it is empty or too long for a symbol.
 * @attr {number} size - Side of the square in px, 16 to 4096; 128 by default.
 * @attr {string} label - Accessible name of the image; the value itself while unset.
 * @attr {'L' | 'M' | 'Q' | 'H'} error-correction - How much damage the code survives: about 7, 15, 25 or 30 percent; `M` by default.
 *
 * @csspart base - The SVG.
 *
 * @cssprop --punica-qr-code-size - Side of the square while `size` is not set.
 * @cssprop --punica-qr-code-foreground - Colour of the dark modules. Keep it darker than the background, or scanners fail.
 * @cssprop --punica-qr-code-background - Colour of the light modules and the quiet zone.
 *
 * @cssstate empty - Nothing is drawn: no value, or one too long to encode.
 */
export class PunicaQrCode extends PunicaElement {
  static properties = {
    value: {},
    label: {},
    errorCorrection: { default: 'M' },
    size: { type: Number }
  };

  static styles = styles;
  static template = `
    <svg part="base" viewBox="0 0 29 29" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
      <rect class="background" width="100%" height="100%"></rect>
      <path class="foreground"></path>
    </svg>
  `;

  #svg = this.$('svg');
  #path = this.$('path');
  #style = instanceStyle(this.shadowRoot);

  update(changed) {
    const size = this.size;
    if (size != null && size >= 16 && size <= 4096) this.#style.setProperty('--_size', `${size}px`);
    else this.#style.removeProperty('--_size');

    if (changed.has('value') || changed.has('errorCorrection')) this.#draw();

    const internals = this.internals;
    const name = this.label || this.value;
    internals.role = name ? 'img' : null;
    internals.ariaLabel = name || null;
    internals.ariaHidden = name ? null : 'true';
  }

  #draw() {
    const level = String(this.errorCorrection ?? 'M').toUpperCase();
    const modules = this.value ? qrMatrix(this.value, /** @type {any} */ (level)) : null;
    this.toggleState('empty', !modules);
    if (!modules) {
      this.#path.setAttribute('d', '');
      return;
    }
    const size = modules.length;
    let d = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!modules[y][x]) continue;
        let run = 1;
        while (x + run < size && modules[y][x + run]) run++;
        d += `M${x + QUIET} ${y + QUIET}h${run}v1h-${run}z`;
        x += run;
      }
    }
    const side = size + QUIET * 2;
    this.#svg.setAttribute('viewBox', `0 0 ${side} ${side}`);
    this.#path.setAttribute('d', d);
  }
}

define('punica-qr-code', PunicaQrCode);
