import { PunicaElement, define } from '../../core/element.js';
import styles from './hidden.css';

/**
 * Hides its content across a range of viewport widths.
 *
 * The breakpoints are `xs` 0, `sm` 600, `md` 900, `lg` 1200 and `xl` 1536 px.
 * The work is done by media queries in the stylesheet; the element holds no
 * listener.
 *
 * @element punica-hidden
 *
 * @attr {'xs' | 'sm' | 'md' | 'lg' | 'xl'} above - Hidden from this breakpoint up.
 * @attr {'sm' | 'md' | 'lg' | 'xl'} below - Hidden under this breakpoint.
 * @attr {'xs' | 'sm' | 'md' | 'lg' | 'xl'} only - Hidden from this breakpoint to the next.
 *
 * @slot - The content.
 */
export class PunicaHidden extends PunicaElement {
  static properties = {
    above: {},
    below: {},
    only: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-hidden', PunicaHidden);
