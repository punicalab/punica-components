import { PunicaElement, define } from '../../core/element.js';
import styles from './code.css';

/**
 * A fragment of code inside running text.
 *
 * @element punica-code
 *
 * @slot - The code, as text.
 *
 * @csspart base - The native `<code>` element.
 *
 * @cssprop --punica-code-background - Background behind the text.
 * @cssprop --punica-code-color - Text colour.
 * @cssprop --punica-code-radius - Corner radius.
 * @cssprop --punica-code-padding - Padding around the text.
 * @cssprop --punica-code-font-size - Font size, relative to the surrounding text.
 */
export class PunicaCode extends PunicaElement {
  static styles = styles;
  static template = `<code part="base"><slot></slot></code>`;
}

define('punica-code', PunicaCode);
