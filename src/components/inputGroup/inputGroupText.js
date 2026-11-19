import { PunicaElement, define } from '../../core/element.js';
import styles from './inputGroupText.css';

/**
 * A short fixed addon of a `punica-input-group`: a currency sign, a
 * protocol, a unit or a decorative icon. It is plain text, not a control,
 * and it is not part of the control's accessible name; put what a screen
 * reader needs in the control's own label ("Amount in euros" beside "€").
 * Its text keeps its own order right-to-left, so `https://` reads as
 * written.
 *
 * @element punica-input-group-text
 *
 * @slot - The text or icon.
 *
 * @csspart base - The cell around the content.
 *
 * @cssprop --punica-input-group-text-height - Minimum block size; the group sets it from its `size`.
 * @cssprop --punica-input-group-text-padding - Inline padding.
 * @cssprop --punica-input-group-text-radius - Corner radius; the group sets it so only the outer corners round.
 * @cssprop --punica-input-group-text-background - Background.
 * @cssprop --punica-input-group-text-color - Text colour.
 */
export class PunicaInputGroupText extends PunicaElement {
  static styles = styles;
  static template = `<span part="base" class="base"><slot></slot></span>`;
}

define('punica-input-group-text', PunicaInputGroupText);
