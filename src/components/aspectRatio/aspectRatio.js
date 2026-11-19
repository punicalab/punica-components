import { PunicaElement, define } from '../../core/element.js';
import styles from './aspectRatio.css';

const RATIO = /^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?)\s*)?$/;

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/**
 * Keeps its content at a fixed ratio of inline to block size.
 *
 * @element punica-aspect-ratio
 *
 * @attr {string} ratio - `inline/block` as two positive numbers (`16/9`), or one number; `1/1` by default and for anything else.
 *
 * @slot - The content, an image, video or frame; it fills the box.
 *
 * @cssprop --punica-aspect-ratio-fit - `object-fit` of the content, `cover` by default.
 */
export class PunicaAspectRatio extends PunicaElement {
  static properties = {
    ratio: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;

  #style = instanceStyle(this.shadowRoot);

  update() {
    const match = RATIO.exec(this.ratio ?? '');
    const inline = match ? Number(match[1]) : 0;
    const block = match ? Number(match[2] ?? 1) : 0;
    if (inline > 0 && block > 0) this.#style.setProperty('--_ratio', `${inline} / ${block}`);
    else this.#style.removeProperty('--_ratio');
  }
}

define('punica-aspect-ratio', PunicaAspectRatio);
