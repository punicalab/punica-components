// The library as a whole: what the manifest documents is what the code does,
// and the global bundle can be loaded twice.
import { describe, it, expect } from 'vitest';
import manifest from '../custom-elements.json';
import * as library from '../src/index.js';

const elements = manifest.modules.flatMap((m) =>
  (m.declarations || []).filter((d) => d.tagName).map((d) => ({ ...d, path: m.path }))
);

describe('library', () => {
  it('documents every defined element and defines every documented one', () => {
    expect(elements.length).toBeGreaterThan(100);
    for (const el of elements) {
      expect(customElements.get(el.tagName), `${el.tagName} (${el.path}) is not defined`).toBeTruthy();
    }
  });

  it('documents every element the library exports', () => {
    const documented = new Set(elements.map((el) => el.tagName));
    const missing = [];
    for (const value of Object.values(library)) {
      if (typeof value !== 'function' || !(value.prototype instanceof library.PunicaElement)) continue;
      const tag = customElements.getName(value);
      if (tag && !documented.has(tag)) missing.push(tag);
    }
    expect(missing).toEqual([]);
  });

  it('documents exactly the attributes each element observes', () => {
    const problems = [];
    for (const el of elements) {
      const ctor = customElements.get(el.tagName);
      const observed = new Set(ctor.observedAttributes || []);
      const documented = new Set((el.attributes || []).map((a) => a.name));
      for (const name of observed) {
        if (!documented.has(name) && !name.startsWith('aria-')) problems.push(`${el.tagName}: "${name}" is observed and not documented`);
      }
      for (const name of documented) {
        if (!observed.has(name)) problems.push(`${el.tagName}: "${name}" is documented and not observed`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('names every attribute in kebab-case and every event punica-*', () => {
    const problems = [];
    for (const el of elements) {
      for (const a of el.attributes || []) {
        if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(a.name)) problems.push(`${el.tagName} attribute ${a.name}`);
      }
      for (const e of el.events || []) {
        if (!/^punica-[a-z]+(-[a-z]+)*$/.test(e.name)) problems.push(`${el.tagName} event ${e.name}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('gives every element a description', () => {
    expect(elements.filter((el) => !el.description).map((el) => el.tagName)).toEqual([]);
  });

  it('loads as a global script, twice, without throwing', async () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    const errors = [];
    frame.contentWindow.addEventListener('error', (e) => errors.push(e.message));
    const load = () =>
      new Promise((resolve, reject) => {
        const script = doc.createElement('script');
        script.src = '/dist/punica-components.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('dist/punica-components.min.js did not load; run npm run build'));
        doc.head.appendChild(script);
      });
    await load();
    await load();
    expect(errors).toEqual([]);
    const win = frame.contentWindow;
    expect(typeof win.Punica.PunicaButton).toBe('function');
    for (const el of elements) {
      expect(win.customElements.get(el.tagName), `${el.tagName} missing from the bundle`).toBeTruthy();
    }
    const button = doc.createElement('punica-button');
    doc.body.appendChild(button);
    expect(button.shadowRoot.querySelector('button')).toBeTruthy();
    frame.remove();
  });
});
