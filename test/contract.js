// The contract every Punica element is held to, whatever it does.
import { describe, it, expect, afterEach } from 'vitest';
import axe from 'axe-core';

const mounted = new Set();

/**
 * Parses `html` into a container on the page and returns its first element.
 * @param {string} html
 * @returns {Promise<any>}
 */
export async function fixture(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  mounted.add(host);
  const el = host.firstElementChild;
  await settle();
  return el;
}

/** Waits for pending microtask updates and one frame. */
export async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((r) => requestAnimationFrame(() => r()));
}

export function cleanup() {
  for (const host of mounted) host.remove();
  mounted.clear();
}

/**
 * Resolves with the next `type` event on `target`.
 * @param {EventTarget} target
 * @param {string} type
 * @returns {Promise<CustomEvent>}
 */
export function once(target, type) {
  return new Promise((resolve) =>
    target.addEventListener(type, (e) => resolve(/** @type {CustomEvent} */ (e)), { once: true })
  );
}

/**
 * Runs axe on an element and returns the violations as short strings.
 * @param {Element} el
 * @param {string[]} [disable] rule ids that do not apply to a bare fixture
 */
export async function a11y(el, disable = []) {
  const rules = Object.fromEntries(
    ['region', 'page-has-heading-one', 'landmark-one-main', ...disable].map((id) => [id, { enabled: false }])
  );
  const result = await axe.run(el, { rules });
  return result.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`
  );
}

/** Records listeners added to window and document that are still attached. */
function trackGlobalListeners() {
  const live = new Set();
  const originals = [];
  for (const target of [window, document, document.body, document.documentElement]) {
    const add = target.addEventListener;
    const remove = target.removeEventListener;
    originals.push([target, add, remove]);
    target.addEventListener = function (type, fn, options) {
      const entry = { target, type, fn, signal: options && typeof options === 'object' ? options.signal : undefined };
      live.add(entry);
      return add.call(this, type, fn, options);
    };
    target.removeEventListener = function (type, fn, options) {
      for (const e of live) if (e.target === target && e.type === type && e.fn === fn) live.delete(e);
      return remove.call(this, type, fn, options);
    };
  }
  return {
    remaining: () => [...live].filter((e) => !e.signal?.aborted).map((e) => e.type),
    restore() {
      for (const [target, add, remove] of originals) {
        target.addEventListener = add;
        target.removeEventListener = remove;
      }
    }
  };
}

/**
 * @param {string} tag
 * @param {object} [options]
 * @param {string} [options.html] markup of a realistic instance for the axe
 *   check; the bare tag by default
 * @param {string[]} [options.axeDisable]
 * @param {(el: any) => void | Promise<void>} [options.open] puts the element
 *   in its busiest state (an open menu) before the disconnect check
 */
export function contract(tag, options = {}) {
  const html = options.html || `<${tag}></${tag}>`;

  describe(`${tag}: contract`, () => {
    afterEach(cleanup);

    it('is defined once and survives a second define', () => {
      const ctor = customElements.get(tag);
      expect(ctor, `${tag} is not defined`).toBeTruthy();
    });

    it('is created by createElement with no attributes and no children', () => {
      const el = document.createElement(tag);
      expect(el.attributes.length).toBe(0);
      expect(el.childNodes.length).toBe(0);
    });

    it('takes a property assigned before upgrade', async () => {
      const ctor = customElements.get(tag);
      const props = [...(ctor._props || new Map())].filter(([, d]) => d.type === String || d.type === Boolean);
      if (!props.length) return;
      const [name, def] = props[0];
      const value = def.type === Boolean ? true : 'x';
      const el = document.createElement(tag);
      Object.defineProperty(el, name, { value, writable: true, configurable: true, enumerable: true });
      document.body.appendChild(el);
      await settle();
      expect(Object.hasOwn(el, name)).toBe(false);
      expect(el[name]).toBe(value);
      el.remove();
    });

    it('reflects properties to attributes and back, and null removes', async () => {
      const ctor = customElements.get(tag);
      const el = await fixture(`<${tag}></${tag}>`);
      for (const [name, def] of ctor._props || []) {
        if (!def.reflect || !def.attribute) continue;
        if (def.type === Boolean) {
          el[name] = true;
          expect(el.hasAttribute(def.attribute), `${name} → ${def.attribute}`).toBe(true);
          el[name] = false;
          expect(el.hasAttribute(def.attribute)).toBe(false);
        } else if (def.type === String) {
          const before = el.getAttribute(def.attribute);
          el[name] = null;
          expect(el.hasAttribute(def.attribute), `${name} = null leaves no attribute`).toBe(false);
          if (before !== null) el.setAttribute(def.attribute, before);
        }
      }
    });

    it('keeps working after being moved, without growing its shadow tree', async () => {
      const el = await fixture(html);
      const count = () => (el.shadowRoot ? el.shadowRoot.querySelectorAll('*').length : el.querySelectorAll('*').length);
      const before = count();
      const parent = el.parentElement;
      el.remove();
      await settle();
      parent.appendChild(el);
      await settle();
      el.remove();
      parent.appendChild(el);
      await settle();
      expect(count()).toBe(before);
    });

    it('leaves no listener on window or document after disconnect', async () => {
      const tracker = trackGlobalListeners();
      try {
        const el = await fixture(html);
        if (options.open) {
          await options.open(el);
          await settle();
        }
        el.parentElement.remove();
        await settle();
        expect(tracker.remaining()).toEqual([]);
      } finally {
        tracker.restore();
      }
    });

    it('has no axe violations', async () => {
      const el = await fixture(html);
      const violations = await a11y(el.parentElement, options.axeDisable);
      expect(violations, violations.join('\n')).toEqual([]);
    });
  });
}
