// The renderer's worker. It has a DOM of its own (happy-dom), defines the
// elements in it, and writes every punica element's shadow root as
// Declarative Shadow DOM. A worker, not the server's own thread: the
// elements read the globals when their module is first evaluated, and a
// server that imported them without a DOM would keep that copy.
import { parentPort, workerData } from 'node:worker_threads';

let Window;
try {
  ({ Window } = await import('happy-dom'));
} catch {
  parentPort.postMessage({ failed: '@punica/components/ssr renders in happy-dom, which is not installed: npm install happy-dom' });
  process.exit(0);
}

const window = new Window({ url: 'http://localhost/' });
const GLOBALS = [
  'window', 'document', 'customElements', 'HTMLElement', 'Element', 'Node', 'Text', 'Comment', 'DocumentFragment',
  'ShadowRoot', 'HTMLTemplateElement', 'HTMLSlotElement', 'HTMLInputElement', 'HTMLButtonElement',
  'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLLabelElement', 'HTMLFormElement', 'FormData', 'CSSStyleSheet',
  'Event', 'CustomEvent', 'KeyboardEvent', 'FocusEvent', 'InputEvent', 'MouseEvent', 'PointerEvent',
  'MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'getComputedStyle', 'matchMedia',
  'requestAnimationFrame', 'cancelAnimationFrame', 'DOMParser', 'Range', 'getSelection', 'location', 'navigator',
  'localStorage', 'sessionStorage'
];
for (const key of GLOBALS) {
  if (window[key] === undefined) continue;
  Object.defineProperty(globalThis, key, { value: key === 'window' ? window : window[key], configurable: true, writable: true });
}

// happy-dom has no ElementInternals; the elements need it only to keep state.
window.HTMLElement.prototype.attachInternals = function () {
  const host = this;
  return {
    states: new Set(),
    form: null,
    labels: [],
    validity: { valid: true },
    validationMessage: '',
    willValidate: true,
    setFormValue() {},
    setValidity(flags = {}, message = '') {
      this.validity = { ...flags, valid: !Object.values(flags).some(Boolean) };
      this.validationMessage = message;
    },
    checkValidity() {
      return this.validity.valid;
    },
    reportValidity() {
      return this.validity.valid;
    },
    get shadowRoot() {
      return host.shadowRoot;
    }
  };
};

// The text every stylesheet was built from: the browser gets the original
// (light-dark(), :state(), @layer), not happy-dom's reading of it.
const sourceOf = new WeakMap();
const replaceSync = window.CSSStyleSheet.prototype.replaceSync;
window.CSSStyleSheet.prototype.replaceSync = function (text) {
  sourceOf.set(this, String(text));
  return replaceSync.call(this, text);
};

await import(workerData.library);

const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const RAW = new Set(['style', 'script']);
const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function serialize(node) {
  if (node.nodeType === 3) return RAW.has(node.parentNode?.localName) ? node.textContent : escapeText(node.textContent);
  if (node.nodeType === 8) return `<!--${node.textContent}-->`;
  if (node.nodeType === 11) return [...node.childNodes].map(serialize).join('');
  if (node.nodeType !== 1) return '';
  const tag = node.localName;
  const attributes = [...node.attributes].map((a) => (a.value === '' ? ` ${a.name}` : ` ${a.name}="${escapeAttribute(a.value)}"`)).join('');
  if (VOID.has(tag)) return `<${tag}${attributes}>`;
  let shadow = '';
  const root = node.shadowRoot;
  if (root && tag.startsWith('punica-')) {
    const css = (root.adoptedStyleSheets || []).map((s) => sourceOf.get(s) ?? [...s.cssRules].map((r) => r.cssText).join('\n')).join('\n');
    shadow = `<template shadowrootmode="open"${root.delegatesFocus ? ' shadowrootdelegatesfocus' : ''}>${css ? `<style>${css}</style>` : ''}${[...root.childNodes].map(serialize).join('')}</template>`;
  }
  const inner = tag === 'template' ? serialize(node.content) : [...node.childNodes].map(serialize).join('');
  return `<${tag}${attributes}>${shadow}${inner}</${tag}>`;
}

const turn = () => new Promise((resolve) => setTimeout(resolve, 0));

parentPort.on('message', async ({ id, html }) => {
  const host = document.createElement('div');
  try {
    document.body.append(host);
    host.innerHTML = html;
    // Updates run in microtasks; a few turns let nested elements finish theirs
    for (let i = 0; i < 3; i++) await turn();
    parentPort.postMessage({ id, html: [...host.childNodes].map(serialize).join('') });
  } catch (error) {
    parentPort.postMessage({ id, error: error?.stack || String(error) });
  } finally {
    host.remove();
  }
});
parentPort.postMessage({ ready: true });
