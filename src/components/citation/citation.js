import { PunicaElement, define } from '../../core/element.js';
import { safeUrl } from '../markdown/url.js';
import '../popover/popover.js';
import styles from './citation.css';

const OPEN_DELAY = 150;
const CLOSE_DELAY = 200;

/**
 * An inline numbered marker for a source, with a card about the source that
 * opens on hover and on focus.
 *
 * With an `href` the marker is a link to the source; without one, or with a
 * URL that is not `http:`, `https:`, `mailto:` or relative, it is a button
 * that toggles the card. Escape closes the card.
 *
 * @element punica-citation
 *
 * @attr {string} index - The number shown in the marker.
 * @attr {string} href - The source's address.
 * @attr {string} heading - The source's title, shown in the card.
 * @attr {string} source - The site or publication, shown in the card.
 * @attr {string} target - Where the link opens, as on `<a>`.
 * @attr {boolean} open - The card is showing.
 * @attr {string} label - Accessible name of the marker; built from `label-citation`, `index` and `heading` by default.
 * @attr {string} label-citation - The word before the number in the accessible name, `Source` by default.
 *
 * @slot - A snippet of the source, shown in the card.
 * @slot snippet - The same, by name.
 *
 * @fires punica-open - The card opened.
 * @fires punica-close - The card closed. `detail.reason` is `escape`, `outside` or `api`.
 *
 * @csspart marker - The link or button.
 * @csspart index - The number.
 * @csspart popover - The `punica-popover` that holds the card.
 * @csspart card - The card.
 * @csspart title - The title in the card.
 * @csspart source - The source in the card.
 * @csspart snippet - The wrapper around the snippet.
 *
 * @cssprop --punica-citation-color - Colour of the number.
 * @cssprop --punica-citation-background - Background of the marker.
 * @cssprop --punica-citation-radius - Corner radius of the marker.
 * @cssprop --punica-citation-card-width - Largest inline size of the card.
 */
export class PunicaCitation extends PunicaElement {
  static properties = {
    index: {},
    href: {},
    heading: {},
    source: {},
    target: {},
    open: { type: Boolean },
    label: {},
    labelCitation: { default: 'Source' }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <a part="marker" class="marker" aria-describedby="card" hidden><span part="index" class="index"></span></a>
    <button part="marker" class="marker" type="button" aria-describedby="card" aria-expanded="false" hidden><span part="index" class="index"></span></button>
    <punica-popover part="popover" side="block-start" align="center" panel-role="group" no-focus>
      <div part="card" class="card" id="card">
        <div part="title" class="title"></div>
        <div part="source" class="source"></div>
        <div part="snippet" class="snippet"><slot name="snippet"></slot><slot></slot></div>
      </div>
    </punica-popover>
  `;

  #link = this.$('a');
  #button = this.$('button');
  #popover = this.$('punica-popover');
  #timer = 0;
  #overCard = false;

  constructor() {
    super();
    for (const marker of [this.#link, this.#button]) {
      marker.addEventListener('pointerenter', () => this.#later(true, OPEN_DELAY));
      marker.addEventListener('pointerleave', () => this.#later(false, CLOSE_DELAY));
      marker.addEventListener('focus', () => this.#later(true, 0));
      // A press on the card takes focus off the marker; the card stays.
      marker.addEventListener('blur', () => !this.#overCard && this.#later(false, 0));
    }
    this.#button.addEventListener('click', () => this.#later(!this.open, 0));
    const card = this.$('.card');
    card.addEventListener('pointerenter', () => {
      this.#overCard = true;
      clearTimeout(this.#timer);
    });
    card.addEventListener('pointerleave', () => {
      this.#overCard = false;
      this.#later(false, CLOSE_DELAY);
    });
    // Escape and outside clicks are the popover's; follow what it did.
    this.#popover.addEventListener('punica-close', () => {
      this.open = false;
    });
  }

  disconnected() {
    clearTimeout(this.#timer);
  }

  update() {
    const url = safeUrl(this.href);
    const marker = url ? this.#link : this.#button;
    this.#link.hidden = !url;
    this.#button.hidden = !!url;
    if (url) {
      this.#link.setAttribute('href', url.href);
      if (url.external) this.#link.setAttribute('rel', 'noopener noreferrer');
      else this.#link.removeAttribute('rel');
      if (this.target) this.#link.setAttribute('target', this.target);
      else this.#link.removeAttribute('target');
    } else {
      this.#link.removeAttribute('href');
    }

    const index = this.index ?? '';
    const name = this.label || [[this.labelCitation, index].filter(Boolean).join(' '), this.heading].filter(Boolean).join(': ');
    for (const el of [this.#link, this.#button]) {
      el.querySelector('.index').textContent = index;
      if (name) el.setAttribute('aria-label', name);
      else el.removeAttribute('aria-label');
    }
    this.#button.setAttribute('aria-expanded', String(this.open));

    const title = this.$('.title');
    title.textContent = this.heading || '';
    title.hidden = !this.heading;
    const source = this.$('.source');
    source.textContent = this.source || '';
    source.hidden = !this.source;

    const popover = this.#popover;
    popover.anchor = marker;
    popover.label = name || null;
    popover.open = this.open;
  }

  /** Opens the card. */
  show() {
    this.open = true;
  }

  /** Closes the card. */
  hide() {
    this.open = false;
  }

  /**
   * @param {boolean} open
   * @param {number} delay ms; hover waits, focus and click do not
   */
  #later(open, delay) {
    clearTimeout(this.#timer);
    if (!delay) {
      this.open = open;
      return;
    }
    this.#timer = setTimeout(() => {
      if (this.isConnected) this.open = open;
    }, delay);
  }
}

define('punica-citation', PunicaCitation);
