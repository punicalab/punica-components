import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './section.css';

/**
 * A titled region of a page: a settings group, a part of a form, a block of
 * a dashboard.
 *
 * Its heading is a real `<h2>` to `<h6>` (by `level`), and the region is a
 * native `<section>` named by that heading, so it is a landmark a screen
 * reader lists. With `collapsible` the heading holds a disclosure button that
 * shows and hides the body.
 *
 * @element punica-section
 *
 * @attr {string} heading - The heading text; the `heading` slot wins over it.
 * @attr {number} level - Rank of the heading in the document outline, 1 to 6, `2` by default.
 * @attr {string} label - Accessible name of the region when it should differ from the heading.
 * @attr {boolean} divider - A line under the header row.
 * @attr {boolean} collapsible - The heading is a button that shows and hides the body.
 * @attr {boolean} open - The body is showing; only read while `collapsible`.
 *
 * @slot - The body.
 * @slot heading - The heading's content, in place of the `heading` attribute.
 * @slot description - A line under the heading.
 * @slot actions - Buttons at the end of the header row.
 *
 * @fires punica-toggle - The user expanded or collapsed a collapsible section. `detail` is `{ open }`.
 *
 * @csspart base - The native `<section>`.
 * @csspart header - The row holding the heading, the description and the actions.
 * @csspart heading - The native heading element.
 * @csspart toggle - The disclosure button of a collapsible section.
 * @csspart chevron - The arrow in that button.
 * @csspart description - The wrapper of the `description` slot.
 * @csspart actions - The wrapper of the `actions` slot.
 * @csspart body - The wrapper of the body.
 *
 * @cssprop --punica-section-gap - Space between the header and the body.
 * @cssprop --punica-section-padding - Padding around the whole section.
 * @cssprop --punica-section-heading-size - Font size of the heading.
 * @cssprop --punica-section-divider-color - Colour of the divider.
 *
 * @cssstate open - A collapsible section's body is showing.
 */
export class PunicaSection extends PunicaElement {
  static properties = {
    heading: {},
    level: { type: Number, default: 2 },
    label: {},
    divider: { type: Boolean },
    collapsible: { type: Boolean },
    open: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <section part="base" class="base">
      <div part="header" class="header">
        <div class="titles">
          <h2 part="heading" class="heading" id="heading"></h2>
          <div part="description" class="description" id="description"><slot name="description"></slot></div>
        </div>
        <div part="actions" class="actions"><slot name="actions"></slot></div>
      </div>
      <div part="body" class="body" id="body"><slot></slot></div>
    </section>
    <template id="parts">
      <button part="toggle" class="toggle" type="button" aria-controls="body">
        <span part="chevron" class="chevron">${icons.chevronEnd}</span>
      </button>
      <span class="title"><slot name="heading"><span class="text"></span></slot></span>
    </template>
  `;

  #base = this.$('section');
  #heading = this.$('.heading');
  #description = this.$('.description');
  #actions = this.$('.actions');
  #body = this.$('.body');
  #descriptionSlot = this.$('slot[name="description"]');
  #actionsSlot = this.$('slot[name="actions"]');
  #toggle;
  #title;
  #text;
  #headingSlot;

  constructor() {
    super();
    const parts = /** @type {HTMLTemplateElement} */ (this.$('#parts'));
    const content = document.importNode(parts.content, true);
    parts.remove();
    this.#toggle = content.querySelector('.toggle');
    this.#title = content.querySelector('.title');
    this.#text = content.querySelector('.text');
    this.#headingSlot = content.querySelector('slot');
    this.#heading.append(this.#title);
    this.#toggle.addEventListener('click', () => {
      if (!this.collapsible) return;
      this.open = !this.open;
      this.emit('toggle', { open: this.open });
    });
    for (const slot of [this.#headingSlot, this.#descriptionSlot, this.#actionsSlot]) {
      slot.addEventListener('slotchange', () => this.requestUpdate());
    }
  }

  /** Expands a collapsible section. Fires nothing. */
  show() {
    this.open = true;
  }

  /** Collapses a collapsible section. Fires nothing. */
  hide() {
    this.open = false;
  }

  /** Expands when collapsed and collapses when expanded. Fires nothing. */
  toggle() {
    this.open = !this.open;
  }

  update(changed) {
    if (changed.has('level')) this.#setLevel();
    this.#text.textContent = this.heading ?? '';
    const heading = this.#heading;

    // The title sits in the button while collapsible, in the heading otherwise.
    if (this.collapsible) {
      if (this.#toggle.parentNode !== heading) heading.append(this.#toggle);
      this.#toggle.append(this.#title);
    } else if (this.#title.parentNode !== heading) {
      this.#toggle.remove();
      heading.append(this.#title);
    }
    const open = !this.collapsible || this.open;
    this.#toggle.setAttribute('aria-expanded', String(open));
    this.#body.hidden = !open;
    this.toggleState('open', this.collapsible && this.open);

    const hasHeading = !!this.heading || this.#headingSlot.assignedNodes().length > 0;
    heading.hidden = !hasHeading;
    const hasDescription = this.#descriptionSlot.assignedNodes({ flatten: true }).length > 0;
    this.#description.hidden = !hasDescription;
    this.#actions.hidden = !this.#actionsSlot.assignedNodes({ flatten: true }).length;
    this.$('.header').hidden = !hasHeading && !hasDescription && this.#actions.hidden;

    const base = this.#base;
    if (this.label) {
      base.setAttribute('aria-label', this.label);
      base.removeAttribute('aria-labelledby');
    } else {
      base.removeAttribute('aria-label');
      if (hasHeading) base.setAttribute('aria-labelledby', 'heading');
      else base.removeAttribute('aria-labelledby');
    }
    if (hasDescription) base.setAttribute('aria-describedby', 'description');
    else base.removeAttribute('aria-describedby');
  }

  /** Swaps the heading element for one of the right rank, keeping its content. */
  #setLevel() {
    const level = Number.isInteger(this.level) && this.level >= 1 && this.level <= 6 ? this.level : 2;
    const old = this.#heading;
    if (old.localName === `h${level}`) return;
    const next = document.createElement(`h${level}`);
    for (const name of ['part', 'class', 'id']) next.setAttribute(name, old.getAttribute(name));
    next.hidden = old.hidden;
    next.append(...old.childNodes);
    old.replaceWith(next);
    this.#heading = next;
  }
}

define('punica-section', PunicaSection);
