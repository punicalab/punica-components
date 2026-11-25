import { PunicaElement, define } from '../../core/element.js';
import '../avatar/avatar.js';
import '../popover/popover.js';
import styles from './avatarGroup.css';

/**
 * The name an avatar answers to: its label, alt or name, else its text.
 * @param {Element} el
 */
const nameOf = (el) =>
  (el.getAttribute('label') || el.getAttribute('alt') || el.getAttribute('name') || el.textContent || '').trim();

/**
 * People as a row of overlapping avatars: the members of a project, the
 * people in a conversation.
 *
 * Its children are `punica-avatar` elements, each with its own picture,
 * name and status. With `max`, the first `max` show and the rest collapse
 * into a "+N" avatar at the end: a button that opens a list of the hidden
 * names, or with `overflow="count"` a plain count. A ring in the surface
 * colour separates the avatars, and the overlap follows the writing
 * direction.
 *
 * @element punica-avatar-group
 *
 * @attr {string} label - Accessible name of the group, `role=group`.
 * @attr {number} max - Most avatars shown; the rest collapse into "+N". All show while unset.
 * @attr {'list' | 'count'} overflow - What "+N" is: a button that lists the hidden names (`list`, the default) or a plain count.
 * @attr {'small' | 'medium' | 'large'} size - Diameter of every avatar in the group, `medium` by default; it wins over each avatar's own `size`.
 * @attr {string} label-overflow - Accessible name of "+N", with `{count}` standing for the number; `{count} more` by default.
 *
 * @slot - The `punica-avatar` elements.
 *
 * @fires punica-open - The list of hidden names opened.
 * @fires {{ reason: 'escape' | 'outside' | 'api' }} punica-close - The list of hidden names closed. `detail.reason` is `escape`, `outside` or `api`.
 *
 * @csspart base - The row.
 * @csspart overflow - The "+N" avatar, a button or a count.
 * @csspart panel - The popover panel listing the hidden avatars.
 * @csspart list - The list inside it.
 * @csspart item - Each entry of the list.
 *
 * @cssprop --punica-avatar-group-size - Diameter of every avatar.
 * @cssprop --punica-avatar-group-overlap - How far each avatar slides under the one before it, a quarter of the diameter by default.
 * @cssprop --punica-avatar-group-ring-width - Width of the ring around each avatar.
 * @cssprop --punica-avatar-group-ring-color - Colour of the ring, the surface colour by default; set it to the background the group sits on.
 *
 * @cssstate overflowing - Some avatars are collapsed into "+N".
 */
export class PunicaAvatarGroup extends PunicaElement {
  static properties = {
    label: {},
    max: { type: Number },
    overflow: {},
    size: {},
    labelOverflow: { default: '{count} more' }
  };

  static styles = styles;
  static shadowOptions = { slotAssignment: 'manual' };
  static template = `
    <div part="base" class="base">
      <slot></slot>
      <punica-popover class="popover" exportparts="panel">
        <button slot="trigger" part="overflow" class="overflow more" type="button"></button>
        <ul part="list" class="list"></ul>
      </punica-popover>
      <span part="overflow" class="overflow count" role="img"></span>
    </div>
  `;

  #slot = this.$('slot');
  #popover = this.$('.popover');
  #more = this.$('.more');
  #count = this.$('.count');
  #list = this.$('.list');
  /** @type {MutationObserver | null} */
  #observer = null;

  connected() {
    this.#observer = new MutationObserver(() => this.#render());
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['label', 'alt', 'name', 'src']
    });
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  update() {
    this.internals.role = 'group';
    this.internals.ariaLabel = this.label || null;
    this.#render();
  }

  /** The avatars collapsed into "+N". @returns {Element[]} */
  get hiddenAvatars() {
    const avatars = this.#avatars();
    return avatars.slice(this.#shownCount(avatars.length));
  }

  #avatars() {
    return [...this.children].filter((el) => el.localName === 'punica-avatar');
  }

  /** @param {number} total */
  #shownCount(total) {
    const max = this.max;
    return Number.isInteger(max) && max >= 0 && max < total ? max : total;
  }

  #render() {
    const avatars = this.#avatars();
    const shown = this.#shownCount(avatars.length);
    this.#slot.assign(...avatars.slice(0, shown));
    const hidden = avatars.slice(shown);
    const n = hidden.length;
    const language = this.closest('[lang]')?.lang || navigator.language;
    const number = new Intl.NumberFormat(language).format(n);
    const name = (this.labelOverflow ?? '').replaceAll('{count}', number);
    const list = this.overflow !== 'count';

    this.toggleState('overflowing', n > 0);
    this.#popover.hidden = !n || !list;
    this.#count.hidden = !n || list;
    this.#more.textContent = `+${number}`;
    this.#count.textContent = `+${number}`;
    this.#more.setAttribute('aria-label', name);
    this.#count.setAttribute('aria-label', name);
    this.#popover.label = name;
    if (!n && this.#popover.open) this.#popover.hide();

    const items = hidden.map((avatar) => {
      const item = document.createElement('li');
      item.className = 'item';
      item.setAttribute('part', 'item');
      const picture = /** @type {HTMLElement} */ (avatar.cloneNode(true));
      picture.removeAttribute('id');
      picture.setAttribute('size', 'small');
      picture.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.className = 'name';
      text.textContent = nameOf(avatar);
      item.append(picture, text);
      return item;
    });
    this.#list.replaceChildren(...items);
    if (this.#popover.open) this.#popover.reposition();
  }
}

define('punica-avatar-group', PunicaAvatarGroup);
