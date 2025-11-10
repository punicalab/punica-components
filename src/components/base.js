/**
 * Base class for Punica web components
 * Handles boolean attribute normalization
 *
 * Usage:
 * class MyComponent extends PunicaBase {
 *   static get booleanAttributes() {
 *     return ['disabled', 'error', 'rounded'];
 *   }
 * }
 */
class PunicaBase extends HTMLElement {
  /**
   * Returns array of boolean attribute names for this component
   * Override in child classes
   * @returns {string[]}
   */
  static get booleanAttributes() {
    return [];
  }

  /**
   * Normalize boolean attribute (remove if value is "false")
   * @param {string} name - Attribute name
   */
  #normalizeBooleanAttribute(name) {
    const value = this.getAttribute(name);
    if (value !== null && value.toLowerCase() === 'false') {
      this.removeAttribute(name);
    }
  }

  /**
   * Normalize all boolean attributes on connect
   */
  connectedCallback() {
    const booleanAttrs = this.constructor.booleanAttributes || [];
    booleanAttrs.forEach((attr) => {
      this.#normalizeBooleanAttribute(attr);
    });
  }

  /**
   * Normalize boolean attributes when they change
   * Call this at the start of your attributeChangedCallback
   * @param {string} name - Attribute name
   * @param {string|null} newValue - New attribute value
   * @returns {boolean} - Returns true if attribute was normalized (removed)
   */
  normalizeBooleanAttributeIfNeeded(name, newValue) {
    const booleanAttrs = this.constructor.booleanAttributes || [];
    if (booleanAttrs.includes(name)) {
      if (newValue !== null && newValue.toLowerCase() === 'false') {
        this.removeAttribute(name);
        return true; // Attribute was removed
      }
    }
    return false; // No normalization needed
  }
}
