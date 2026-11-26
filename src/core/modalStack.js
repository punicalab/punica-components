/**
 * The modal surfaces open now, the topmost last (2026-11-23). While one is
 * open, everything outside it is inert and under it in the top layer; what
 * must stay usable over it (the toaster) moves into the topmost one.
 */
const stack = [];

/** Dispatched on `document` when the topmost modal surface changes. */
export const MODAL_STACK_CHANGE = 'punica-modal-stack';

/** @returns {HTMLElement | null} the topmost open modal surface */
export function topModal() {
  return stack.at(-1) ?? null;
}

/** @param {HTMLElement} surface */
export function modalOpened(surface) {
  const at = stack.indexOf(surface);
  if (at >= 0) stack.splice(at, 1);
  stack.push(surface);
  document.dispatchEvent(new Event(MODAL_STACK_CHANGE));
}

/** @param {HTMLElement} surface */
export function modalClosed(surface) {
  const at = stack.indexOf(surface);
  if (at < 0) return;
  stack.splice(at, 1);
  document.dispatchEvent(new Event(MODAL_STACK_CHANGE));
}
