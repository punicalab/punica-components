/**
 * Whether a slot has anything assigned to it that a person would see: an
 * element, or text that is not only white space.
 * @param {HTMLSlotElement} slot
 * @returns {boolean}
 */
export const slotHasContent = (slot) =>
  slot
    .assignedNodes({ flatten: true })
    .some((node) => node.nodeType === 1 || (node.nodeType === 3 && node.textContent.trim() !== ''));
