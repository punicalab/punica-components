import { PunicaElement, define } from '../../core/element.js';
import { prefersReducedMotion } from '../../core/a11y.js';
import styles from './outline.css';

const LEVEL = /^h[1-6]$/;

/**
 * The element the target scrolls in: the target itself or its nearest
 * scrolling ancestor, through slots and shadow roots; null for the page.
 * @param {Element | null} target
 * @returns {Element | null}
 */
function scrollerOf(target) {
  for (let n = /** @type {any} */ (target); n; n = n.assignedSlot || n.parentNode || n.host || null) {
    if (!(n instanceof Element) || n === document.documentElement || n === document.body) continue;
    if (/^(auto|scroll|overlay)$/.test(getComputedStyle(n).overflowY)) return n;
  }
  return null;
}

/**
 * A table of contents for one page: "On this page".
 *
 * It reads the headings inside a target element, builds a nested list of
 * links to them, and marks the section being read: the one whose heading is
 * in the top part of the scrolling area the target is in, or else the last
 * one scrolled past. A heading with no id is
 * given one from its text. The list follows the target: headings added,
 * removed or renamed are picked up as they change.
 *
 * @element punica-outline
 *
 * @attr {string} for - Id of the element whose headings are listed, in the same tree.
 * @attr {string} levels - The heading tags to list, separated by spaces or commas, `h2 h3` by default.
 * @attr {string} label - Accessible name of the navigation landmark, `On this page` by default.
 *
 * @prop {Element | null} target - The element whose headings are listed; wins over `for`.
 * @prop {string | null} active - Id of the heading whose section is being read (read-only).
 * @prop {Element[]} headings - The headings listed, in document order (read-only).
 *
 * @fires {{ value: string, item: HTMLElement }} punica-select - The user activated a link. `detail` is `{ value, item }`: the heading's id and the heading. Cancelable: preventing it keeps the page where it is.
 *
 * @csspart base - The native `<nav>`.
 * @csspart list - Every `<ul>`, the outer one and the nested ones.
 * @csspart item - Every `<li>`.
 * @csspart link - Every link; the active one also carries `current`.
 * @csspart current - The link of the section being read.
 *
 * @cssprop --punica-outline-indent - Indent of each nested level.
 * @cssprop --punica-outline-track-color - Colour of the line along the links.
 * @cssprop --punica-outline-active-color - Colour of the active link and its mark.
 * @cssprop --punica-outline-offset - Height of a fixed header over the content; a heading counts as read once it passes under it.
 *
 * @cssstate empty - The target has no headings to list.
 */
export class PunicaOutline extends PunicaElement {
  static properties = {
    for: {},
    levels: { default: 'h2 h3' },
    label: { default: 'On this page' },
    target: { type: Object, attribute: false }
  };

  static styles = styles;
  static template = `<nav part="base"><ul part="list" class="list"></ul></nav>`;

  #nav = this.$('nav');
  #list = this.$('.list');
  /** @type {HTMLElement[]} */
  #headings = [];
  /** @type {Map<Element, HTMLAnchorElement>} */
  #links = new Map();
  /** @type {Map<Element, boolean>} */
  #visible = new Map();
  /** @type {Set<Element>} */
  #above = new Set();
  #active = null;
  #signature = '';
  /** @type {Element | null} */
  #observed = null;
  /** @type {IntersectionObserver | null} */
  #intersection = null;
  /** @type {MutationObserver | null} */
  #mutation = null;
  #frame = 0;
  #rescan = false;

  constructor() {
    super();
    this.#list.addEventListener('click', (event) => this.#onClick(/** @type {MouseEvent} */ (event)));
  }

  get active() {
    return this.#active?.id || null;
  }

  get headings() {
    return [...this.#headings];
  }

  /** The element whose headings are listed. */
  get targetElement() {
    if (this.target) return this.target;
    if (!this.for) return null;
    const root = /** @type {Document | ShadowRoot} */ (this.getRootNode());
    return root.getElementById?.(this.for) || null;
  }

  connected() {
    this.#mutation = new MutationObserver(() => this.#schedule());
    // A target written after this element in the page is found once it is parsed.
    if (document.readyState === 'loading') {
      this.listen(document, 'DOMContentLoaded', () => this.#observe());
    }
    this.#observe();
  }

  disconnected() {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#mutation?.disconnect();
    this.#mutation = null;
    this.#intersection?.disconnect();
    this.#intersection = null;
    this.#observed = null;
    this.#signature = '';
  }

  update(changed) {
    this.#nav.setAttribute('aria-label', this.label);
    if (changed.has('for') || changed.has('target') || changed.has('levels')) this.#observe();
  }

  /** Reads the target's headings again. Call after changing them in a way the element cannot see. */
  refresh() {
    this.#signature = '';
    this.#scan();
  }

  /** Points the observers at the current target and lists its headings. */
  #observe() {
    if (!this.isConnected) return;
    const target = this.targetElement;
    if (target !== this.#observed) {
      this.#mutation?.disconnect();
      this.#observed = target;
      if (target) {
        this.#mutation?.observe(target, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['id', 'hidden']
        });
      }
    }
    this.#signature = '';
    this.#scan();
  }

  #schedule() {
    if (this.#rescan) return;
    this.#rescan = true;
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => {
      this.#rescan = false;
      this.#scan();
    });
  }

  #tags() {
    const tags = String(this.levels || '')
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((tag) => LEVEL.test(tag));
    return tags.length ? tags : ['h2', 'h3'];
  }

  #scan() {
    const target = this.#observed;
    const headings = target
      ? /** @type {HTMLElement[]} */ ([...target.querySelectorAll(this.#tags().join(','))]).filter(
          (h) => !h.closest('[hidden]') && this.#text(h)
        )
      : [];
    for (const heading of headings) if (!heading.id) heading.id = this.#uniqueId(heading);
    const signature = headings.map((h) => `${h.localName}#${h.id}:${this.#text(h)}`).join('\n');
    if (signature === this.#signature && target) return;
    this.#signature = signature;
    this.#headings = headings;
    this.#build();
    this.#spy();
  }

  /** @param {Element} heading */
  #text(heading) {
    return (heading.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /** @param {Element} heading */
  #uniqueId(heading) {
    const base =
      this.#text(heading)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'section';
    const root = /** @type {Document | ShadowRoot} */ (heading.getRootNode());
    let id = base;
    for (let n = 2; root.getElementById?.(id); n++) id = `${base}-${n}`;
    return id;
  }

  #build() {
    const list = this.#list;
    list.replaceChildren();
    this.#links.clear();
    // Each open list remembers the rank of the heading it hangs under; a
    // heading deeper than the one before it opens a list under that one.
    const stack = [{ parentRank: 0, list }];
    /** @type {{ li: HTMLLIElement, rank: number } | null} */
    let lastItem = null;
    for (const heading of this.#headings) {
      const rank = Number(heading.localName[1]);
      if (lastItem && rank > lastItem.rank) {
        const nested = document.createElement('ul');
        nested.setAttribute('part', 'list');
        nested.className = 'list nested';
        lastItem.li.append(nested);
        stack.push({ parentRank: lastItem.rank, list: nested });
      } else {
        while (stack.length > 1 && stack.at(-1).parentRank >= rank) stack.pop();
      }
      const li = document.createElement('li');
      li.setAttribute('part', 'item');
      li.className = 'item';
      const a = document.createElement('a');
      a.setAttribute('part', 'link');
      a.className = 'link';
      a.href = `#${encodeURIComponent(heading.id)}`;
      a.textContent = this.#text(heading);
      li.append(a);
      stack.at(-1).list.append(li);
      this.#links.set(heading, a);
      lastItem = { li, rank };
    }
    this.toggleState('empty', this.#headings.length === 0);
    this.#active = null;
    this.#mark(null);
  }

  #spy() {
    this.#intersection?.disconnect();
    this.#visible.clear();
    this.#above.clear();
    if (!this.#headings.length) {
      this.#intersection = null;
      return;
    }
    const offset = parseFloat(getComputedStyle(this).getPropertyValue('--punica-outline-offset')) || 0;
    // A heading is being read while it sits in the top part of the view.
    this.#intersection = new IntersectionObserver((entries) => this.#onIntersect(entries), {
      root: scrollerOf(this.#observed),
      rootMargin: `${-offset}px 0px -55% 0px`
    });
    for (const heading of this.#headings) this.#intersection.observe(heading);
  }

  /** @param {IntersectionObserverEntry[]} entries */
  #onIntersect(entries) {
    for (const entry of entries) {
      this.#visible.set(entry.target, entry.isIntersecting);
      const top = entry.rootBounds ? entry.rootBounds.top : 0;
      if (!entry.isIntersecting && entry.boundingClientRect.top < top) this.#above.add(entry.target);
      else this.#above.delete(entry.target);
    }
    const headings = this.#headings;
    let active = headings.find((h) => this.#visible.get(h)) || null;
    if (!active) {
      for (const h of headings) if (this.#above.has(h)) active = h;
    }
    if (!active && this.#active && headings.includes(this.#active)) active = this.#active;
    this.#setActive(active);
  }

  /** @param {Element | null} heading */
  #setActive(heading) {
    if (heading === this.#active) return;
    this.#active = heading;
    this.#mark(heading);
  }

  /** @param {Element | null} heading */
  #mark(heading) {
    for (const [h, a] of this.#links) {
      const on = h === heading;
      a.setAttribute('part', on ? 'link current' : 'link');
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  }

  /** @param {MouseEvent} event */
  #onClick(event) {
    const link = /** @type {Element} */ (event.target).closest?.('a');
    if (!link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const heading = [...this.#links].find(([, a]) => a === link)?.[0];
    if (!heading) return;
    const selected = this.emit('select', { value: heading.id, item: heading }, { cancelable: true });
    if (selected.defaultPrevented) {
      event.preventDefault();
      return;
    }
    this.#setActive(heading);
    // A heading in the document is reached by the link itself, which also
    // sets the address; one inside a shadow root is out of the link's reach.
    if (heading.getRootNode() !== document) {
      event.preventDefault();
      heading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }
}

define('punica-outline', PunicaOutline);
