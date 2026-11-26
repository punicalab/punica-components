import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { icons } from '../../core/icons.js';
import styles from './selectableCard.css';

/** The browser's own message for a required checkbox, in the user's language. */
const missingMessage = () => {
  const probe = document.createElement('input');
  probe.type = 'checkbox';
  probe.required = true;
  return probe.validationMessage || ' ';
};

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A card that is a choice: the whole card is the control, with its media,
 * title and description inside.
 *
 * Outside a group the card is a checkbox and a form control of its own: it
 * submits `value` under `name` while checked, and Space or Enter toggles
 * it. Inside a `punica-selectable-card-group` it is a radio: the group owns
 * the value, the keyboard and the tab order, and the card's own `name` is
 * not submitted. `type="radio"` outside a group draws a radio and does
 * nothing, like a `punica-radio` outside its group.
 *
 * The title names the control and the description describes it; `label`
 * replaces the name.
 *
 * @element punica-selectable-card
 *
 * @attr {'checkbox' | 'radio'} type - Kind of choice: `radio` inside a group, `checkbox` elsewhere, by default.
 * @attr {string} value - What the card stands for: submitted while a checkbox card is checked (`on` by default), the group's value while a radio card is chosen.
 * @attr {boolean} checked - Chosen. A group sets it on its cards; in markup, the default.
 * @attr {string} name - Name a checkbox card submits its value under.
 * @attr {string} label - Accessible name, in place of the title.
 * @attr {boolean} disabled - Cannot be chosen, takes no focus and submits nothing.
 * @attr {boolean} required - A checkbox card has to be checked before the form submits.
 *
 * @slot - More content under the description: a price, a list.
 * @slot media - An image or icon at the top of the card.
 * @slot title - The card's title; its accessible name.
 * @slot description - Text under the title; its accessible description.
 *
 * @fires {{ checked: boolean, value: string }} punica-change - The user toggled a checkbox card; `detail: { checked, value }`. A radio card fires nothing; its group does.
 *
 * @csspart base - The card's box.
 * @csspart media - The wrapper around the `media` slot.
 * @csspart body - The column of the title, the description and the default slot, beside or under the media.
 * @csspart title - The wrapper around the `title` slot.
 * @csspart description - The wrapper around the `description` slot.
 * @csspart indicator - The drawn checkbox or radio in the corner.
 *
 * @cssprop --punica-selectable-card-padding - Padding of the card.
 * @cssprop --punica-selectable-card-radius - Corner radius.
 * @cssprop --punica-selectable-card-background - Background at rest.
 * @cssprop --punica-selectable-card-border-color - Border at rest.
 * @cssprop --punica-selectable-card-checked-color - Border, ring and indicator colour while checked.
 * @cssprop --punica-selectable-card-checked-background - Background while checked.
 *
 * @cssstate checked - Chosen.
 * @cssstate radio - Drawn and announced as a radio.
 * @cssstate disabled - Disabled, by itself, its group or a fieldset.
 * @cssstate invalid - Required and not checked.
 * @cssstate valid - Meets its constraint.
 */
export class PunicaSelectableCard extends FormControl(PunicaElement) {
  static properties = {
    type: {},
    value: {},
    checked: { type: Boolean },
    label: {}
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <div part="media" class="media" hidden><slot name="media"></slot></div>
      <div part="body" class="body">
        <div part="title" class="title"><slot name="title"></slot></div>
        <div part="description" class="description"><slot name="description"></slot></div>
        <slot></slot>
      </div>
      <span part="indicator" class="indicator" aria-hidden="true">${icons.check}</span>
    </div>
  `;

  #default = false;

  constructor() {
    super();
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => this.requestUpdate());
    }
    this.addEventListener('click', (event) => this.#onClick(event));
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
  }

  /** The group the card belongs to, if any. @returns {any} */
  get group() {
    return this.closest('punica-selectable-card-group');
  }

  /** Whether the card is a radio: in a group, or `type="radio"`. */
  get isRadio() {
    return !!this.group || this.type === 'radio';
  }

  update() {
    const radio = this.isRadio;
    const group = this.group;
    const off = this.isDisabled || !!group?.isDisabled;
    const internals = this.internals;
    internals.role = radio ? 'radio' : 'checkbox';
    internals.ariaChecked = String(this.checked);
    internals.ariaDisabled = off ? 'true' : null;
    internals.ariaRequired = !radio && this.required ? 'true' : null;
    internals.ariaLabel = this.label || null;
    const titles = this.$('slot[name="title"]').assignedElements();
    const descriptions = this.$('slot[name="description"]').assignedElements();
    if ('ariaLabelledByElements' in internals) {
      /** @type {any} */ (internals).ariaLabelledByElements = !this.label && titles.length ? titles : null;
      /** @type {any} */ (internals).ariaDescribedByElements = descriptions.length ? descriptions : null;
    }
    this.$('.media').hidden = !this.$('slot[name="media"]').assignedNodes().length;
    this.$('.title').hidden = !titles.length;
    this.$('.description').hidden = !descriptions.length;

    // A group puts its cards in the tab order; a lone checkbox card is its own stop.
    if (!group) {
      if (radio || off) this.removeAttribute('tabindex');
      else if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    }

    this.toggleState('checked', this.checked);
    this.toggleState('radio', radio);
    this.toggleState('disabled', off);

    if (radio) {
      this.setFormValue(null);
      this.setValidity({});
    } else {
      this.setFormValue(this.checked ? this.value ?? 'on' : null, String(this.checked));
      const missing = this.required && !this.checked;
      this.setValidity(missing ? { valueMissing: true } : {}, missing ? missingMessage() : '');
    }
  }

  firstUpdated() {
    this.#default = this.checked;
  }

  formReset() {
    if (!this.isRadio) this.checked = this.#default;
  }

  formRestore(state) {
    if (!this.isRadio) this.checked = state === 'true';
  }

  /** Toggles a checkbox card the way a user would, firing `punica-change`; chooses a radio card through its group. */
  click() {
    super.click();
  }

  #onClick(event) {
    if (this.isRadio) return;
    if (this.isDisabled) return;
    // A link or button inside the card keeps its own click.
    const inner = event.composedPath().find((node) => node instanceof Element && node !== this && node.matches?.(INTERACTIVE));
    if (inner && this.contains(inner)) return;
    this.checked = !this.checked;
    this.update(new Map());
    this.emit('change', { checked: this.checked, value: this.value ?? 'on' });
  }

  #onKeydown(event) {
    if (event.target !== this || this.isDisabled || this.group?.isDisabled) return;
    if (event.key === 'Enter' || (event.key === ' ' && !this.isRadio)) {
      event.preventDefault();
      if (!event.repeat) this.click();
    }
  }
}

define('punica-selectable-card', PunicaSelectableCard);
