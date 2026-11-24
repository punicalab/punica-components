import tokensCss from '../tokens/tokens.css';

/**
 * PunicaElement: the base class every Punica component extends.
 *
 * It gives a component, from static declarations alone:
 *  - properties with attribute reflection, typed conversion and upgrade of
 *    values assigned before the element was defined (`static properties`);
 *  - a shadow root cloned once from `static template`, styled by constructable
 *    stylesheets shared by every instance (`static styles`);
 *  - a connection-scoped AbortSignal (`this.signal`, `this.listen`) so nothing
 *    added while connected outlives a disconnect, and a moved element works;
 *  - batched updates: `update(changed)` runs once per microtask;
 *  - `emit()` for `punica-*` events, `internals` and custom states.
 *
 * Importing this module touches no DOM, so it is safe outside a browser.
 */

const HAS_DOM = typeof HTMLElement !== 'undefined';
const Base = HAS_DOM ? HTMLElement : /** @type {typeof HTMLElement} */ (class {});

const BASE_CSS = `
:host { box-sizing: border-box; }
:host([hidden]) { display: none !important; }
/* Chromium maps an align attribute on any element to text-align; here align
   is a placement, never a text alignment. */
:host([align]) { text-align: inherit; }
*, *::before, *::after { box-sizing: border-box; }
`;

let baseSheet;
let tokensInstalled = false;

/**
 * Builds a constructable stylesheet from CSS text.
 * @param {string} text
 * @returns {CSSStyleSheet}
 */
export function sheet(text) {
  const s = new CSSStyleSheet();
  s.replaceSync(text);
  return s;
}

/**
 * Adopts the token sheet on the document once. The tokens live in a cascade
 * layer, so a page's own unlayered `--punica-*` declarations always win.
 */
export function installTokens() {
  if (tokensInstalled || typeof document === 'undefined') return;
  tokensInstalled = true;
  if (document.documentElement.hasAttribute('data-punica-no-tokens')) return;
  document.adoptedStyleSheets = [sheet(tokensCss), ...document.adoptedStyleSheets];
}

/**
 * Registers a custom element unless the tag is already taken.
 * @param {string} tag
 * @param {CustomElementConstructor} ctor
 */
export function define(tag, ctor) {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

/** @param {string} name camelCase → kebab-case */
const kebab = (name) => name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

let uidCounter = 0;
/**
 * A document-unique id.
 * @param {string} [prefix]
 */
export const uid = (prefix = 'punica') => `${prefix}-${++uidCounter}`;

/**
 * @typedef {object} PropertyDeclaration
 * @property {typeof String | typeof Boolean | typeof Number | typeof Object | typeof Array} [type]
 *   String by default.
 * @property {string | false} [attribute] Attribute name; kebab-case of the
 *   property name by default, `false` for a property with no attribute.
 * @property {boolean} [reflect] Write the property back to the attribute.
 *   True by default for String, Boolean and Number.
 * @property {unknown} [default] Value read while nothing is set.
 */

export class PunicaElement extends Base {
  /** @type {Record<string, PropertyDeclaration>} */
  static properties = {};
  /** CSS text, or a list of CSS texts. @type {string | string[]} */
  static styles = '';
  /** Static, author-written shadow markup. Never interpolate data into it. */
  static template = '';
  /** Set to false for a light-DOM component. */
  static shadow = true;
  /** @type {Partial<ShadowRootInit>} */
  static shadowOptions = {};

  static finalize() {
    if (Object.hasOwn(this, '_finalized')) return;
    this._finalized = true;
    const parent = Object.getPrototypeOf(this);
    if (typeof parent.finalize === 'function') parent.finalize();
    /** @type {Map<string, Required<PropertyDeclaration>>} */
    this._props = new Map(parent._props || []);
    /** @type {Map<string, string>} */
    this._attrs = new Map(parent._attrs || []);
    const own = Object.hasOwn(this, 'properties') ? this.properties : {};
    for (const [name, raw] of Object.entries(own)) {
      const type = raw.type || String;
      const primitive = type === String || type === Boolean || type === Number;
      const attribute =
        raw.attribute === false ? false : raw.attribute || kebab(name);
      const def = {
        type,
        attribute,
        reflect: raw.reflect ?? (primitive && attribute !== false),
        default: raw.default ?? (type === Boolean ? false : null)
      };
      this._props.set(name, def);
      if (attribute) this._attrs.set(attribute, name);
      Object.defineProperty(this.prototype, name, {
        get() {
          return this._get(name);
        },
        set(value) {
          this._set(name, value);
        },
        configurable: true,
        enumerable: true
      });
    }
  }

  static get observedAttributes() {
    this.finalize();
    return [...this._attrs.keys()];
  }

  static _sheets() {
    if (!Object.hasOwn(this, '_sheetCache')) {
      baseSheet ||= sheet(BASE_CSS);
      const own = [this.styles].flat().filter(Boolean);
      this._sheetCache = [baseSheet, ...own.map(sheet)];
    }
    return this._sheetCache;
  }

  static _template() {
    if (!Object.hasOwn(this, '_templateCache')) {
      const t = document.createElement('template');
      // Without the template's leading and trailing whitespace: in an element laid out inline (a link, a chip) it was
      // text, drawn as a space beside the element's own ("Production : Jasper").
      t.innerHTML = this.template.trim();
      this._templateCache = t;
    }
    return this._templateCache;
  }

  #values = new Map();
  /** @type {Map<string, unknown> | null} */
  #pending = null;
  #scheduled = false;
  #updating = false;
  #updated = false;
  #reflecting = null;
  /** @type {AbortController | null} */
  #abort = null;
  /** @type {ElementInternals | null} */
  #internals = null;

  constructor() {
    super();
    const ctor = /** @type {typeof PunicaElement} */ (this.constructor);
    ctor.finalize();
    installTokens();
    if (ctor.shadow) {
      const root = this.attachShadow({ mode: 'open', ...ctor.shadowOptions });
      root.adoptedStyleSheets = ctor._sheets();
      if (ctor.template) {
        // importNode, not cloneNode: custom elements inside the template
        // are upgraded as they are created.
        root.appendChild(document.importNode(ctor._template().content, true));
      }
    }
  }

  /* ---------------------------------------------------------------- props */

  _get(name) {
    const def = this.constructor._props.get(name);
    const value = this.#values.get(name);
    return value ?? def.default;
  }

  _set(name, raw) {
    const def = this.constructor._props.get(name);
    const value = convert(raw, def.type);
    const old = this._get(name);
    if (Object.is(old, value ?? def.default)) {
      this.#values.set(name, value);
      return;
    }
    this.#values.set(name, value);
    if (def.reflect && def.attribute) {
      this.#reflecting = name;
      try {
        writeAttribute(this, def.attribute, value, def.type);
      } finally {
        this.#reflecting = null;
      }
    }
    this.#changed(name, old);
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue) return;
    const ctor = this.constructor;
    const name = ctor._attrs.get(attribute);
    if (!name || this.#reflecting === name) return;
    const def = ctor._props.get(name);
    const old = this._get(name);
    const value = readAttribute(newValue, def.type);
    this.#values.set(name, value);
    if (!Object.is(old, value ?? def.default)) this.#changed(name, old);
  }

  #changed(name, old) {
    this.#pending ||= new Map();
    if (!this.#pending.has(name)) this.#pending.set(name, old);
    this.requestUpdate();
  }

  /** Schedules `update()` for the end of the current microtask. */
  requestUpdate() {
    if (this.#scheduled || !this.isConnected || !this.#updated) return;
    this.#scheduled = true;
    queueMicrotask(() => {
      // Already run by `updateNow()`.
      if (!this.#scheduled) return;
      this.#scheduled = false;
      if (this.isConnected) this.#flush();
    });
  }

  /**
   * Runs the scheduled update now instead of at the end of the microtask. A form control calls it so that what the
   * form reads (its value, its validity) follows an assignment at once, as a native control's does. Inside an update
   * it waits for the microtask, as before.
   */
  updateNow() {
    if (!this.#scheduled || this.#updating || !this.isConnected) return;
    this.#scheduled = false;
    this.#flush();
  }

  #flush() {
    const changed = this.#pending || new Map();
    this.#pending = null;
    this.#updating = true;
    try {
      this.update(changed);
    } finally {
      this.#updating = false;
    }
  }

  /** Resolves after the pending update, if any, has run. */
  get updateComplete() {
    return Promise.resolve().then(() => undefined);
  }

  /* ------------------------------------------------------------ lifecycle */

  connectedCallback() {
    const ctor = this.constructor;
    if (!this.#updated) {
      // A value assigned before the element was defined sits on the instance
      // and shadows the accessor; hand it to the setter.
      for (const name of ctor._props.keys()) {
        if (Object.hasOwn(this, name)) {
          const value = this[name];
          delete this[name];
          this[name] = value;
        }
      }
    }
    this.#abort = new AbortController();
    this.connected();
    if (!this.#updated) {
      this.#updated = true;
      const all = new Map();
      for (const name of ctor._props.keys()) all.set(name, undefined);
      this.#pending = null;
      this.update(all);
      this.firstUpdated();
    } else if (this.#pending) {
      this.#flush();
    }
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#abort = null;
    this.disconnected();
  }

  /** Runs on every connect, before the update. Add outside listeners here. */
  connected() {}
  /** Runs on every disconnect, after `this.signal` aborted. */
  disconnected() {}
  /**
   * Brings the shadow tree in line with the properties.
   * @param {Map<string, unknown>} changed property name → previous value;
   *   holds every property on the first run.
   */
  // eslint-disable-next-line no-unused-vars
  update(changed) {}
  /** Runs once, after the first update. */
  firstUpdated() {}

  /* -------------------------------------------------------------- helpers */

  /** Aborts on disconnect. Only valid while connected. */
  get signal() {
    return this.#abort?.signal;
  }

  /**
   * addEventListener that is removed on disconnect.
   * @param {EventTarget} target
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} handler
   * @param {AddEventListenerOptions} [options]
   */
  listen(target, type, handler, options) {
    target.addEventListener(type, handler, { ...options, signal: this.signal });
  }

  /**
   * First match in the shadow root.
   * @param {string} selector
   * @returns {any}
   */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  /**
   * Dispatches `punica-<name>`, bubbling and composed.
   * @param {string} name
   * @param {unknown} [detail]
   * @param {{ cancelable?: boolean }} [options]
   * @returns {CustomEvent} the dispatched event; check `defaultPrevented`
   */
  emit(name, detail, options) {
    const event = new CustomEvent(`punica-${name}`, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: options?.cancelable ?? false
    });
    this.dispatchEvent(event);
    return event;
  }

  /** @returns {ElementInternals} */
  get internals() {
    return (this.#internals ||= this.attachInternals());
  }

  /**
   * Adds or removes a custom state, matched in CSS by `:state(name)`.
   * @param {string} name
   * @param {boolean} on
   */
  toggleState(name, on) {
    const states = this.internals.states;
    if (!states) return;
    if (on) {
      try {
        states.add(name);
      } catch {
        states.add(`--${name}`);
      }
    } else {
      states.delete(name);
      states.delete(`--${name}`);
    }
  }
}

function convert(value, type) {
  if (type === Boolean) return value != null && value !== false;
  if (value == null) return null;
  if (type === Number) {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  if (type === String) return String(value);
  return value;
}

function readAttribute(value, type) {
  if (type === Boolean) return value !== null;
  if (value === null) return null;
  if (type === Number) {
    const n = Number(value);
    return value.trim() === '' || Number.isNaN(n) ? null : n;
  }
  if (type === Object || type === Array) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function writeAttribute(el, attribute, value, type) {
  if (type === Boolean) el.toggleAttribute(attribute, !!value);
  else if (value == null) el.removeAttribute(attribute);
  else el.setAttribute(attribute, String(value));
}
