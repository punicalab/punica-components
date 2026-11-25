import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { slotHasContent } from './slots.js';
import styles from './chatLayout.css';

/** How far from the end, in px, still counts as being at the latest message. */
const THRESHOLD = 8;

/**
 * The frame of a conversation: a scrolling message area above a composer.
 *
 * While the reader is at the end, the view follows new content as it streams
 * in. Once they scroll up it stays where they put it and a button offers the
 * way back.
 *
 * @element punica-chat-layout
 *
 * @attr {string} label - Accessible name of the scrolling message area, `Messages` by default.
 * @attr {string} label-scroll-to-latest - Accessible name of the button that jumps to the end, `Jump to latest` by default.
 *
 * @prop {boolean} atBottom - Read-only: the view is following the latest content.
 *
 * @slot - The messages, usually one `punica-chat-message-list`.
 * @slot header - A title bar above the messages.
 * @slot composer - The input area below the messages, usually a `punica-chat-composer`.
 *
 * @fires {{ atBottom: boolean }} punica-scroll-state - The view started or stopped following the latest content. `detail.atBottom`.
 *
 * @csspart header - The wrapper around the header slot.
 * @csspart body - The area that holds the scroller and the jump button.
 * @csspart scroller - The scrolling element.
 * @csspart content - The centred column inside the scroller.
 * @csspart scroll-button - The jump-to-latest button.
 * @csspart composer - The wrapper around the composer slot.
 *
 * @cssprop --punica-chat-layout-background - Background of the frame.
 * @cssprop --punica-chat-layout-padding - Padding around the messages and the composer.
 * @cssprop --punica-chat-layout-max-width - Largest inline size of the message column and the composer.
 *
 * @cssstate at-bottom - The view is following the latest content.
 */
export class PunicaChatLayout extends PunicaElement {
  static properties = {
    label: { default: 'Messages' },
    labelScrollToLatest: { default: 'Jump to latest' }
  };

  static styles = styles;
  static template = `
    <div part="header" class="header" hidden><slot name="header"></slot></div>
    <div part="body" class="body">
      <div part="scroller" class="scroller" role="group" tabindex="0">
        <div part="content" class="content"><slot></slot></div>
      </div>
      <button part="scroll-button" class="jump" type="button" hidden>${icons.chevronDown}</button>
    </div>
    <div part="composer" class="composer" hidden><slot name="composer"></slot></div>
  `;

  #scroller = this.$('.scroller');
  #content = this.$('.content');
  #jump = this.$('.jump');
  /** @type {ResizeObserver | null} */
  #resize = null;
  /** @type {MutationObserver | null} */
  #mutation = null;
  /** The reader is following the end. */
  #pinned = true;
  /** scrollTop as this element last left or saw it; null when unknown. */
  #top = /** @type {number | null} */ (null);
  /** The largest scrollTop of the content as last seen. */
  #extent = 0;

  constructor() {
    super();
    this.#scroller.addEventListener('scroll', () => this.#sync(true), { passive: true });
    this.#jump.addEventListener('click', () => {
      this.scrollToLatest();
      this.#scroller.focus({ preventScroll: true });
    });
    for (const name of ['header', 'composer']) {
      const slot = this.$(`slot[name="${name}"]`);
      slot.addEventListener('slotchange', () => {
        slot.parentElement.hidden = !slotHasContent(slot);
      });
    }
  }

  connected() {
    // A reconnected scroller is back at the start; where it was is unknown.
    this.#top = null;
    this.#resize = new ResizeObserver(() => this.#sync(false));
    this.#resize.observe(this.#scroller);
    this.#resize.observe(this.#content);
    this.#mutation = new MutationObserver(() => this.#sync(false));
    this.#mutation.observe(this, { childList: true, subtree: true, characterData: true });
  }

  disconnected() {
    this.#resize?.disconnect();
    this.#resize = null;
    this.#mutation?.disconnect();
    this.#mutation = null;
  }

  update() {
    this.#scroller.setAttribute('aria-label', this.label);
    this.#jump.setAttribute('aria-label', this.labelScrollToLatest);
  }

  /** True while the view follows the latest content. */
  get atBottom() {
    return this.#pinned;
  }

  /** Scrolls to the latest content and follows it again. */
  scrollToLatest() {
    const scroller = this.#scroller;
    scroller.scrollTop = scroller.scrollHeight;
    this.#top = scroller.scrollTop;
    this.#extent = scroller.scrollHeight - scroller.clientHeight;
    this.#setPinned(true);
  }

  /**
   * Decides whether the reader is following the end and, if so, goes there.
   * A scroll position this element did not set is the reader's doing.
   * @param {boolean} fromScroll called by a scroll event
   */
  #sync(fromScroll) {
    const scroller = this.#scroller;
    const extent = scroller.scrollHeight - scroller.clientHeight;
    const top = scroller.scrollTop;
    const moved = this.#top !== null && Math.abs(top - this.#top) > 1;
    let pinned = this.#pinned;
    if (moved) {
      // Judged against the content as it was when they scrolled, too: new
      // content may have arrived in the same frame.
      pinned = Math.min(extent, this.#extent) - top <= THRESHOLD;
    } else if (!pinned) {
      pinned = extent - top <= THRESHOLD;
    }
    // Never pull against a scroll in progress; the next content change does.
    if (pinned && !(fromScroll && moved)) scroller.scrollTop = scroller.scrollHeight;
    this.#top = scroller.scrollTop;
    this.#extent = extent;
    this.#setPinned(pinned);
  }

  /** @param {boolean} pinned */
  #setPinned(pinned) {
    this.toggleState('at-bottom', pinned);
    this.#jump.hidden = pinned;
    if (pinned === this.#pinned) return;
    this.#pinned = pinned;
    this.emit('scroll-state', { atBottom: pinned });
  }
}

define('punica-chat-layout', PunicaChatLayout);
