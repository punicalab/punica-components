/**
 * Keyboard and focus helpers shared by composite widgets (WAI-ARIA APG).
 */

/**
 * The index a navigation key moves to, or -1 when the key is not one.
 * Arrow keys follow the orientation and the writing direction; Home and End
 * go to the ends.
 *
 * @param {KeyboardEvent} event
 * @param {number} count number of items
 * @param {number} current index of the active item (-1 for none)
 * @param {{ orientation?: 'horizontal' | 'vertical' | 'both', loop?: boolean, rtl?: boolean }} [options]
 * @returns {number}
 */
export function nextIndex(event, count, current, options = {}) {
  const { orientation = 'vertical', loop = true, rtl = false } = options;
  if (!count) return -1;
  const vertical = orientation !== 'horizontal';
  const horizontal = orientation !== 'vertical';
  let step = 0;
  switch (event.key) {
    case 'ArrowDown':
      if (vertical) step = 1;
      break;
    case 'ArrowUp':
      if (vertical) step = -1;
      break;
    case 'ArrowRight':
      if (horizontal) step = rtl ? -1 : 1;
      break;
    case 'ArrowLeft':
      if (horizontal) step = rtl ? 1 : -1;
      break;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return -1;
  }
  if (!step) return -1;
  if (current < 0) return step > 0 ? 0 : count - 1;
  const next = current + step;
  if (loop) return (next + count) % count;
  return Math.max(0, Math.min(count - 1, next));
}

/** @param {Element} el */
export const isRtl = (el) => getComputedStyle(el).direction === 'rtl';

/** @type {Set<() => void>} */
const directionListeners = new Set();
/** @type {MutationObserver | null} */
let directionObserver = null;

/**
 * Calls `callback` when a `dir` attribute changes anywhere in the document,
 * for elements that measure their layout in one direction (a sliding
 * indicator) and must measure again when it flips. Nothing else announces a
 * change of direction. Stops when `signal` aborts.
 * @param {() => void} callback
 * @param {AbortSignal} signal
 */
export function onDirectionChange(callback, signal) {
  if (signal.aborted) return;
  directionListeners.add(callback);
  if (!directionObserver) {
    directionObserver = new MutationObserver(() => {
      for (const listener of directionListeners) listener();
    });
    directionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
      subtree: true
    });
  }
  signal.addEventListener(
    'abort',
    () => {
      directionListeners.delete(callback);
      if (!directionListeners.size && directionObserver) {
        directionObserver.disconnect();
        directionObserver = null;
      }
    },
    { once: true }
  );
}

/**
 * Roving tabindex: one item of a group is in the tab order, arrow keys move
 * focus between the others.
 *
 * @param {HTMLElement[]} items enabled items, in order
 * @param {HTMLElement | null} active the item that should be tabbable
 */
export function setRovingTabindex(items, active) {
  const target = active && items.includes(active) ? active : items[0];
  for (const item of items) item.tabIndex = item === target ? 0 : -1;
}

/**
 * Type-to-select: returns a function that takes a keydown and the items'
 * labels and answers the index of the first label starting with what was
 * typed within the last half second, or -1.
 */
export function createTypeahead() {
  let buffer = '';
  let timer = 0;
  /**
   * @param {KeyboardEvent} event
   * @param {string[]} labels
   * @param {number} [current]
   */
  return (event, labels, current = -1) => {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
      return -1;
    }
    if (event.key === ' ' && !buffer) return -1;
    clearTimeout(timer);
    timer = setTimeout(() => (buffer = ''), 500);
    buffer += event.key.toLowerCase();
    const n = labels.length;
    // A repeated single letter cycles through the matches for that letter.
    const repeated = [...buffer].every((c) => c === buffer[0]);
    const query = repeated ? buffer[0] : buffer;
    const start = repeated ? current + 1 : Math.max(current, 0);
    for (let i = 0; i < n; i++) {
      const index = (start + i) % n;
      if (labels[index].trim().toLowerCase().startsWith(query)) return index;
    }
    return -1;
  };
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

/**
 * The first focusable element inside `root`, looking through slots and open
 * shadow roots.
 * @param {Element | ShadowRoot} root
 * @returns {HTMLElement | null}
 */
export function firstFocusable(root) {
  const walk = (node) => {
    if (node instanceof HTMLElement) {
      if (node.matches(FOCUSABLE) || (node.shadowRoot?.delegatesFocus && !node.hasAttribute('disabled'))) {
        return node;
      }
    }
    if (node instanceof HTMLSlotElement) {
      for (const assigned of node.assignedElements({ flatten: true })) {
        const found = walk(assigned);
        if (found) return found;
      }
      return null;
    }
    const children = node.shadowRoot ? node.shadowRoot.children : node.children;
    for (const child of children) {
      const found = walk(child);
      if (found) return found;
    }
    return null;
  };
  for (const child of root.children) {
    const found = walk(child);
    if (found) return found;
  }
  return null;
}

/**
 * The element that really has focus, through shadow roots.
 * @returns {Element | null}
 */
export function deepActiveElement() {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

/**
 * Whether `node` is inside `root` in the composed tree: through shadow roots
 * and through slots, where DOM `contains()` stops.
 * @param {Node} root
 * @param {Node | null} node
 */
export function composedContains(root, node) {
  for (let n = node; n; ) {
    if (n === root) return true;
    n = /** @type {any} */ (n).assignedSlot || n.parentNode || /** @type {any} */ (n).host || null;
  }
  return false;
}

/**
 * Whether the user asked for reduced motion.
 */
export const prefersReducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
