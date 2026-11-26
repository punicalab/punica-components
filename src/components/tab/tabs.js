import { PunicaElement, define, uid } from '../../core/element.js';
import { nextIndex, setRovingTabindex, isRtl, onDirectionChange } from '../../core/a11y.js';
import styles from './tabs.css';

/**
 * A set of tabs and the panels they show, one at a time.
 *
 * `punica-tab` and `punica-tab-panel` are direct children; a tab and a panel
 * with the same `value` belong together. Without `value` attributes they
 * pair up by position.
 *
 * @element punica-tabs
 *
 * @attr {string} value - The `value` of the selected tab; the first enabled tab when absent.
 * @attr {'horizontal' | 'vertical'} orientation - Direction of the tab list, `horizontal` by default.
 * @attr {'auto' | 'manual'} activation - `auto` selects a tab when an arrow key focuses it, `manual` waits for Enter or Space.
 * @attr {string} label - Accessible name of the tab list.
 * @attr {boolean} full-width - The tabs share the whole inline size.
 * @attr {boolean} disabled - No tab can be selected.
 *
 * @slot - The `punica-tab-panel` elements.
 * @slot tab - The `punica-tab` elements; a tab places itself here.
 *
 * @fires {{ value: string }} punica-change - The user selected another tab. `detail.value` is its value.
 *
 * @csspart tablist - The element with `role="tablist"`.
 * @csspart indicator - The line that slides under the selected tab.
 * @csspart panels - The wrapper around the panels.
 *
 * @cssprop --punica-tabs-indicator-color - Color of the sliding indicator.
 * @cssprop --punica-tabs-indicator-size - Thickness of the sliding indicator.
 * @cssprop --punica-tabs-border-color - Color of the line the tab list stands on.
 * @cssprop --punica-tabs-gap - Space between the tab list and the panels.
 */
export class PunicaTabs extends PunicaElement {
  static properties = {
    value: {},
    orientation: { default: 'horizontal' },
    activation: { default: 'auto' },
    label: {},
    fullWidth: { type: Boolean },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <div part="tablist" class="tablist" role="tablist">
      <slot name="tab"></slot>
      <span part="indicator" class="indicator"></span>
    </div>
    <div part="panels" class="panels"><slot></slot></div>
  `;

  #tablist = this.$('.tablist');
  #indicator = this.$('.indicator');
  /** @type {ResizeObserver | null} */
  #resize = null;
  #placed = false;

  /** The tab and list size last scrolled for. */
  #revealed = '';

  constructor() {
    super();
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => this.requestUpdate());
    }
    this.addEventListener('click', (event) => {
      const tab = this.#tabOf(event);
      if (tab && !this.#isDisabled(tab)) this.#select(tab);
    });
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
  }

  /** The tabs, in order. */
  get tabs() {
    return /** @type {HTMLElement[]} */ ([...this.children].filter((el) => el.localName === 'punica-tab'));
  }

  /** The panels, in order. */
  get panels() {
    return /** @type {HTMLElement[]} */ ([...this.children].filter((el) => el.localName === 'punica-tab-panel'));
  }

  connected() {
    this.#placed = false;
    this.#resize = new ResizeObserver(() => this.#placeIndicator());
    this.#resize.observe(this.#tablist);
    onDirectionChange(() => this.#placeIndicator(), this.signal);
    // Children may have changed while this was out of the document.
    this.requestUpdate();
  }

  disconnected() {
    this.#resize?.disconnect();
    this.#resize = null;
  }

  /** @param {Event} event */
  #tabOf(event) {
    const target = /** @type {Element} */ (event.target);
    const tab = target.closest?.('punica-tab');
    return tab && tab.parentElement === this ? /** @type {HTMLElement} */ (tab) : null;
  }

  #isDisabled(tab) {
    return this.disabled || tab.hasAttribute('disabled');
  }

  #key(el, index) {
    return el.value ?? el.getAttribute('value') ?? String(index);
  }

  #enabled() {
    return this.tabs.filter((tab) => !this.#isDisabled(tab));
  }

  /** The tab the current `value` selects, or the first enabled one. */
  get selectedTab() {
    const tabs = this.tabs;
    const match = this.value == null ? null : tabs.find((tab, i) => this.#key(tab, i) === this.value);
    // A wholly disabled set still shows a tab and its panel.
    return match || tabs.find((tab) => !this.#isDisabled(tab)) || tabs.find((tab) => !tab.hasAttribute('disabled')) || tabs[0] || null;
  }

  #select(tab) {
    const value = this.#key(tab, this.tabs.indexOf(tab));
    if (value === this.value) return;
    this.value = value;
    this.emit('change', { value });
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    const tab = this.#tabOf(event);
    if (!tab || event.target !== tab) return;
    const enabled = this.#enabled();
    const index = nextIndex(event, enabled.length, enabled.indexOf(tab), {
      orientation: this.orientation === 'vertical' ? 'vertical' : 'horizontal',
      rtl: isRtl(this)
    });
    if (index >= 0) {
      event.preventDefault();
      const next = enabled[index];
      setRovingTabindex(enabled, next);
      next.focus();
      if (this.activation !== 'manual') this.#select(next);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.#isDisabled(tab)) this.#select(tab);
    }
  }

  update(changed) {
    const tabs = this.tabs;
    if (changed.has('disabled')) for (const tab of tabs) /** @type {any} */ (tab).requestUpdate?.();
    const panels = this.panels;
    const vertical = this.orientation === 'vertical';
    this.#tablist.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
    if (this.label) this.#tablist.setAttribute('aria-label', this.label);
    else this.#tablist.removeAttribute('aria-label');

    const selected = this.selectedTab;
    const selectedKey = selected ? this.#key(selected, tabs.indexOf(selected)) : null;
    if (this.value == null && selectedKey != null) this.value = selectedKey;

    const panelByKey = new Map(panels.map((panel, i) => [this.#key(panel, i), panel]));
    tabs.forEach((tab, i) => {
      const key = this.#key(tab, i);
      /** @type {any} */ (tab).selected = tab === selected;
      if (!tab.id) tab.id = uid('punica-tab');
      const panel = panelByKey.get(key);
      if (panel) {
        if (!panel.id) panel.id = uid('punica-tab-panel');
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', tab.id);
      } else {
        tab.removeAttribute('aria-controls');
      }
    });
    panels.forEach((panel, i) => {
      /** @type {any} */ (panel).active = this.#key(panel, i) === selectedKey;
    });

    const enabled = this.#enabled();
    const focused = enabled.find((tab) => tab.matches(':focus'));
    for (const tab of tabs) if (!enabled.includes(tab)) tab.tabIndex = -1;
    setRovingTabindex(enabled, focused || (enabled.includes(selected) ? selected : null));
    this.#placeIndicator();
  }

  /**
   * Scrolls the tab list, and only it, so the selected tab is in view.
   * @param {HTMLElement} tab
   * @param {DOMRect} list
   * @param {DOMRect} rect
   * @param {boolean} vertical
   */
  #reveal(tab, list, rect, vertical) {
    // Once per selected tab and list size: scrolling by hand is not undone
    // until the list is resized.
    const key = `${tab.id}:${Math.round(list.width)}:${Math.round(list.height)}`;
    if (key === this.#revealed || !rect.width || tab.assignedSlot?.name !== 'tab') return;
    this.#revealed = key;
    const box = this.#tablist;
    if (vertical) {
      if (rect.top < list.top) box.scrollTop -= list.top - rect.top;
      else if (rect.bottom > list.bottom) box.scrollTop += rect.bottom - list.bottom;
    } else if (rect.left < list.left) {
      box.scrollLeft -= list.left - rect.left;
    } else if (rect.right > list.right) {
      box.scrollLeft += rect.right - list.right;
    }
  }

  #placeIndicator() {
    const indicator = this.#indicator;
    const tab = this.selectedTab;
    if (!tab || !this.isConnected) {
      indicator.hidden = true;
      return;
    }
    indicator.hidden = false;
    const list = this.#tablist.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();
    const vertical = this.orientation === 'vertical';
    const offset = vertical
      ? rect.top - list.top + this.#tablist.scrollTop
      : (isRtl(this) ? rect.right - list.right : rect.left - list.left) + this.#tablist.scrollLeft;
    indicator.style.setProperty('--_offset', `${offset}px`);
    indicator.style.setProperty('--_size', `${vertical ? rect.height : rect.width}px`);
    this.#reveal(tab, list, rect, vertical);
    if (!this.#placed && rect.width) {
      // The first placement is not a slide.
      this.#placed = true;
      void indicator.offsetWidth;
      indicator.classList.add('animated');
    }
  }
}

define('punica-tabs', PunicaTabs);
