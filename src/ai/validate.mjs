// Checks markup that uses punica elements against custom-elements.json:
// what a model (or a person) most often gets wrong is a tag, attribute,
// value, slot or event that does not exist, or a 1.x name. Reads HTML, JSX
// and Vue templates with a small tag scanner, and the event names in
// script. Pure: no Node and no DOM.
import { closest } from './knowledge.mjs';

/** @typedef {{ line: number, column: number, severity: 'error' | 'warning', rule: string, message: string, fix?: string }} Finding */

/** Attributes any HTML element takes. `aria-*`, `data-*` and `on*` are checked by prefix. */
const GLOBAL_ATTRIBUTES = new Set(
  'accesskey autocapitalize autofocus class contenteditable dir draggable enterkeyhint exportparts hidden id inert inputmode is itemid itemprop itemref itemscope itemtype lang nonce part popover popovertarget popovertargetaction role slot spellcheck style tabindex title translate writingsuggestions'.split(
    ' '
  )
);
/** Props React and Preact handle themselves. */
const JSX_PROPS = new Set('key ref className class htmlFor style children dangerouslySetInnerHTML suppressHydrationWarning suppressContentEditableWarning tabIndex'.split(' '));
/** Native events that pass through every element, so `onClick` and `click` are fine. */
const NATIVE_PASS_THROUGH = new Set(
  'click dblclick auxclick contextmenu focus blur focusin focusout keydown keyup keypress pointerdown pointerup pointermove pointerenter pointerleave pointerover pointerout pointercancel mousedown mouseup mousemove mouseenter mouseleave mouseover mouseout wheel touchstart touchend touchmove touchcancel dragstart drag dragend dragenter dragleave dragover drop scroll scrollend copy cut paste animationstart animationend transitionend gotpointercapture lostpointercapture submit reset formdata invalid'.split(
    ' '
  )
);
/** Native names a punica element never fires; it fires `punica-<name>` instead. */
const SYNTHETIC = new Set(['change', 'input', 'select', 'open', 'close', 'toggle', 'dismiss']);
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

const camelToKebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * @param {ReturnType<import('./knowledge.mjs').createKnowledge>} knowledge
 */
export function createValidator(knowledge) {
  /**
   * @param {string} source
   * @param {{ kind?: 'html' | 'jsx' | 'vue' | 'js' }} [options] guessed from the text when absent
   * @returns {Finding[]}
   */
  function validate(source, options = {}) {
    const text = String(source);
    const kind = options.kind || guessKind(text);
    /** @type {Finding[]} */
    const findings = [];
    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineStarts.push(i + 1);
    const where = (offset) => {
      let lo = 0;
      let hi = lineStarts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= offset) lo = mid;
        else hi = mid - 1;
      }
      return { line: lo + 1, column: offset - lineStarts[lo] + 1 };
    };
    const report = (offset, severity, rule, message, fix) => findings.push({ ...where(offset), severity, rule, message, ...(fix ? { fix } : {}) });

    const usesPunica = /punica-/.test(text);
    if (kind !== 'js') scanMarkup(text, kind, report);
    scanScript(text, usesPunica, report);
    return findings.sort((a, b) => a.line - b.line || a.column - b.column);
  }

  function scanMarkup(text, kind, report) {
    /** @type {{ tag: string }[]} */
    const stack = [];
    const tagRe = /<(\/?)([A-Za-z][\w.:-]*)/g;
    let match;
    while ((match = tagRe.exec(text))) {
      const offset = match.index;
      // Skip comments: jump past `-->` when the scanner lands inside one.
      const commentStart = text.lastIndexOf('<!--', offset);
      if (commentStart !== -1 && text.indexOf('-->', commentStart) > offset) {
        tagRe.lastIndex = text.indexOf('-->', commentStart) + 3;
        continue;
      }
      const closing = match[1] === '/';
      const rawName = match[2];
      const name = kind === 'jsx' ? rawName : rawName.toLowerCase();
      if (closing) {
        const i = findLast(stack, (s) => s.tag === name);
        if (i !== -1) stack.length = i;
        const end = text.indexOf('>', tagRe.lastIndex);
        tagRe.lastIndex = end === -1 ? text.length : end + 1;
        continue;
      }
      const { attributes, end, selfClosing } = readAttributes(text, tagRe.lastIndex, kind);
      tagRe.lastIndex = end;
      const parent = stack[stack.length - 1]?.tag;
      checkElement(name, offset, attributes, parent, kind, report);
      if (RAW_TEXT.has(name.toLowerCase()) && !selfClosing) {
        const close = text.toLowerCase().indexOf(`</${name.toLowerCase()}`, end);
        tagRe.lastIndex = close === -1 ? text.length : close;
        continue;
      }
      if (!selfClosing && !VOID.has(name.toLowerCase())) stack.push({ tag: name });
    }
  }

  function checkElement(name, offset, attributes, parent, kind, report) {
    const tag = name.toLowerCase();
    if (!tag.startsWith('punica-')) {
      checkSlot(attributes, parent, report);
      return;
    }
    const element = knowledge.get(tag);
    if (!element) {
      const old = knowledge.legacy(tag);
      if (old) report(offset, 'error', 'legacy-tag', old.message, old.replacement || undefined);
      else {
        const guess = closest(tag, knowledge.tags);
        report(offset, 'error', 'unknown-tag', `<${tag}> is not a punica element.${guess ? ` Did you mean <${guess}>?` : ' Search with `punica-components search`.'}`, guess || undefined);
      }
      return;
    }
    const byName = new Map(element.attributes.map((a) => [a.name, a]));
    const byProperty = new Map(element.attributes.map((a) => [a.property, a]));
    const properties = new Set([...element.properties.map((p) => p.name), ...element.attributes.map((a) => a.property)]);
    const events = new Set(element.events.map((e) => e.name));
    const parentElement = parent ? knowledge.get(parent.toLowerCase()) : null;

    for (const attr of attributes) {
      let attrName = attr.name;
      const at = attr.offset;
      // Vue: `@event`, `v-on:event`, `:prop` / `v-bind:prop`, `.prop`.
      if (kind === 'vue' || /^[@:.]|^v-/.test(attrName)) {
        const vueEvent = /^(?:@|v-on:)([\w-]+)/.exec(attrName);
        if (vueEvent) {
          checkEventName(vueEvent[1], element, events, at, report);
          continue;
        }
        if (/^v-(?!bind:)/.test(attrName)) continue;
        const bound = /^(?::|v-bind:|\.)([\w-]+)/.exec(attrName);
        if (bound) {
          attrName = bound[1];
          if (properties.has(attrName) || byName.has(attrName) || isGlobal(attrName)) continue;
        }
      }
      if (kind === 'jsx') {
        if (JSX_PROPS.has(attrName)) continue;
        const reactEvent = /^on([A-Z]\w*|-?[a-z][\w-]*)$/.exec(attrName);
        if (reactEvent && !byName.has(attrName)) {
          const raw = reactEvent[1];
          if (/^[A-Z]/.test(raw)) {
            const lower = raw.toLowerCase();
            if (NATIVE_PASS_THROUGH.has(lower) || (lower === 'doubleclick')) continue;
            if (SYNTHETIC.has(lower) || /^punica/.test(lower)) {
              const real = /^punica/.test(lower) ? camelToKebab(raw[0].toLowerCase() + raw.slice(1)) : `punica-${lower}`;
              report(at, 'error', 'react-event', `${attrName} never fires: <${element.tag}> dispatches \`${real}\`. In React 19 write on${real}={…}; in React 18 add a listener in an effect.`, `on${real}`);
              continue;
            }
            report(at, 'warning', 'react-event', `${attrName}: <${element.tag}> has no such event.`);
            continue;
          }
          checkEventName(raw.replace(/^-/, ''), element, events, at, report);
          continue;
        }
        // React 19 sets a prop that names a property as that property; one
        // that backs an attribute still has to hold one of its values.
        if (byProperty.has(attrName)) {
          checkValue(byProperty.get(attrName), attr, element, report);
          continue;
        }
        if (properties.has(attrName)) continue;
      }
      if (isGlobal(attrName)) continue;
      if (kind !== 'jsx' && /^on[a-z]/.test(attrName)) continue;
      if (parentElement?.childAttributes.includes(attrName.toLowerCase())) continue;
      const lower = attrName.toLowerCase();
      const spec = byName.get(lower);
      if (!spec) {
        const kebab = camelToKebab(attrName);
        const byCamel = byProperty.get(attrName) || byName.get(kebab);
        if (byCamel) {
          report(at, 'error', 'attribute-case', `\`${attrName}\` on <${element.tag}>: the attribute is \`${byCamel.name}\` (HTML lowercases \`${attrName}\` to \`${lower}\`).`, byCamel.name);
        } else if (byName.has(lower.replace(/^(\w+?)(width|height|size|level|label|text|icon|value)$/, '$1-$2'))) {
          const fixed = lower.replace(/^(\w+?)(width|height|size|level|label|text|icon|value)$/, '$1-$2');
          report(at, 'error', 'attribute-case', `\`${attrName}\` on <${element.tag}>: the attribute is \`${fixed}\`.`, fixed);
        } else if (properties.has(attrName)) {
          report(at, 'error', 'property-as-attribute', `\`${attrName}\` on <${element.tag}> is a property with no attribute: set it from script (\`el.${attrName} = …\`).`);
        } else {
          const guess = closest(lower, [...byName.keys()]);
          report(at, 'error', 'unknown-attribute', `<${element.tag}> has no attribute \`${attrName}\`.${guess ? ` Did you mean \`${guess}\`?` : ''} Its attributes: ${[...byName.keys()].join(', ') || 'none'}.`, guess || undefined);
        }
        continue;
      }
      checkValue(spec, attr, element, report);
    }
    checkSlot(attributes, parent, report);
  }

  function checkValue(spec, attr, element, report) {
    if (attr.value === null || attr.dynamic) return;
    const value = attr.value;
    if (element.tag === 'punica-icon' && spec.name === 'name' && !knowledge.icons.includes(value)) {
      const guess = closest(value, knowledge.icons);
      report(attr.offset, 'error', 'unknown-icon', `<punica-icon name="${value}"> draws nothing: the built-in glyphs are ${knowledge.icons.join(', ')}. For any other icon, slot an <svg> into <punica-icon>.`, guess || undefined);
    }
    if (spec.values) {
      if (!spec.values.includes(value)) {
        const guess = closest(value, spec.values);
        report(attr.offset, 'error', 'invalid-value', `\`${spec.name}="${value}"\` on <${element.tag}>: one of ${spec.values.map((v) => `\`${v}\``).join(', ')}.`, guess || undefined);
      }
    } else if (spec.type === 'boolean') {
      if (value === 'false') report(attr.offset, 'warning', 'boolean-false', `\`${spec.name}="false"\` still means ${spec.name}: a boolean attribute is on when present. Leave it out.`);
    } else if (spec.type === 'number' && value.trim() !== '' && Number.isNaN(Number(value))) {
      report(attr.offset, 'error', 'invalid-value', `\`${spec.name}="${value}"\` on <${element.tag}> should be a number.`);
    }
  }

  function checkSlot(attributes, parent, report) {
    const slot = attributes.find((a) => a.name === 'slot');
    if (!slot || slot.value === null || slot.dynamic || !parent || !parent.toLowerCase().startsWith('punica-')) return;
    const element = knowledge.get(parent.toLowerCase());
    if (!element || !element.slots.length) return;
    const names = element.slots.map((s) => s.name).filter(Boolean);
    if (names.includes(slot.value)) return;
    const old = { startIcon: 'start', endIcon: 'end', startAdornment: 'start', endAdornment: 'end' }[slot.value];
    const guess = old && names.includes(old) ? old : closest(slot.value, names);
    report(slot.offset, 'error', 'unknown-slot', `<${element.tag}> has no slot \`${slot.value}\`.${guess ? ` Did you mean \`${guess}\`?` : ''} Its named slots: ${names.join(', ') || 'none (default slot only)'}.`, guess || undefined);
  }

  function checkEventName(name, element, events, offset, report) {
    if (events.has(name) || NATIVE_PASS_THROUGH.has(name)) return;
    if (SYNTHETIC.has(name) && events.has(`punica-${name}`)) {
      report(offset, 'error', 'native-event-name', `<${element.tag}> fires \`punica-${name}\`, not \`${name}\`.`, `punica-${name}`);
      return;
    }
    const guess = closest(name, [...events]);
    report(offset, events.size || name.startsWith('punica-') ? 'error' : 'warning', 'unknown-event', `<${element.tag}> fires no \`${name}\`.${guess ? ` Did you mean \`${guess}\`?` : ''} Its events: ${[...events].join(', ') || 'none of its own'}.`, guess || undefined);
  }

  function scanScript(text, usesPunica, report) {
    const listenerRe = /\b(?:addEventListener|removeEventListener)\(\s*(['"`])([\w:-]+)\1/g;
    let match;
    while ((match = listenerRe.exec(text))) {
      const name = match[2];
      const offset = match.index + match[0].indexOf(name);
      if (name.startsWith('punica-')) {
        if (!knowledge.allEvents.has(name)) {
          // A near miss is a typo; anything else may be the page's own event.
          const guess = closest(name, [...knowledge.allEvents]);
          if (guess) report(offset, 'error', 'unknown-event', `No punica element fires \`${name}\`. Did you mean \`${guess}\`?`, guess);
          else report(offset, 'warning', 'unknown-event', `No punica element fires \`${name}\`; fine if it is your own event.`);
        }
      } else if (usesPunica && SYNTHETIC.has(name)) {
        report(offset, 'warning', 'native-event-name', `Punica elements fire \`punica-${name}\`, never \`${name}\`; a listener for \`${name}\` on one never runs.`, `punica-${name}`);
      }
    }
    // A selector or createElement with a tag that does not exist.
    const tagInScript = /(?:createElement|querySelector(?:All)?|closest|customElements\.(?:get|whenDefined))\(\s*(['"`])([^'"`]*?)\1/g;
    while ((match = tagInScript.exec(text))) {
      for (const found of match[2].matchAll(/punica-[a-z0-9-]+/g)) {
        const tag = found[0];
        if (knowledge.get(tag)) continue;
        const offset = match.index + match[0].indexOf(match[2]) + found.index;
        const old = knowledge.legacy(tag);
        if (old) report(offset, 'error', 'legacy-tag', old.message, old.replacement || undefined);
        else {
          const guess = closest(tag, knowledge.tags);
          report(offset, 'error', 'unknown-tag', `${tag} is not a punica element.${guess ? ` Did you mean ${guess}?` : ''}`, guess || undefined);
        }
      }
    }
    // 1.x globals.
    const toast = /\bwindow\.Toast\b|\bToast\.(?:show|success|error|info|warning)\(/g;
    while ((match = toast.exec(text))) report(match.index, 'error', 'legacy-api', 'The global `Toast` is 1.x: `import { toast } from \'@punica/components\'`.');
    const bundle = /build\.min\.js/g;
    while ((match = bundle.exec(text))) report(match.index, 'error', 'legacy-api', '`build.min.js` is 1.x: load `@punica/components` or `dist/punica-components.min.js`.');
  }

  return { validate };
}

/** Reads `name`, `name=value`, `name="value"`, `name={expr}` up to `>`. */
function readAttributes(text, start, kind) {
  const attributes = [];
  let i = start;
  const n = text.length;
  while (i < n) {
    while (i < n && /\s/.test(text[i])) i++;
    if (text[i] === '>') return { attributes, end: i + 1, selfClosing: false };
    if (text[i] === '/' && text[i + 1] === '>') return { attributes, end: i + 2, selfClosing: true };
    if (text[i] === '{') {
      // JSX spread `{...props}`.
      i = skipBraces(text, i);
      continue;
    }
    const nameStart = i;
    while (i < n && !/[\s=>]/.test(text[i]) && !(text[i] === '/' && text[i + 1] === '>')) i++;
    const name = text.slice(nameStart, i);
    if (!name) {
      i++;
      continue;
    }
    while (i < n && /\s/.test(text[i])) i++;
    let value = null;
    let dynamic = false;
    if (text[i] === '=') {
      i++;
      while (i < n && /\s/.test(text[i])) i++;
      const quote = text[i];
      if (quote === '"' || quote === "'") {
        const close = text.indexOf(quote, i + 1);
        value = text.slice(i + 1, close === -1 ? n : close);
        i = close === -1 ? n : close + 1;
        dynamic = /\$\{|\{\{/.test(value);
      } else if (quote === '{' && kind !== 'html') {
        const end = skipBraces(text, i);
        const expr = text.slice(i + 1, end - 1).trim();
        const literal = /^(['"`])([^'"`$]*)\1$/.exec(expr);
        if (literal) value = literal[2];
        else dynamic = true;
        i = end;
      } else {
        const valueStart = i;
        while (i < n && !/[\s>]/.test(text[i])) i++;
        value = text.slice(valueStart, i);
        dynamic = /\$\{|\{/.test(value);
      }
    }
    // A name that is itself a template placeholder says nothing.
    if (!/[${}]/.test(name)) attributes.push({ name, value, dynamic, offset: nameStart });
  }
  return { attributes, end: n, selfClosing: false };
}

function skipBraces(text, i) {
  let depth = 0;
  for (; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i + 1;
    else if (c === '"' || c === "'" || c === '`') {
      const close = text.indexOf(c, i + 1);
      if (close === -1) return text.length;
      i = close;
    }
  }
  return text.length;
}

function isGlobal(name) {
  return GLOBAL_ATTRIBUTES.has(name) || /^(aria|data)-/.test(name) || name === 'xmlns' || name.startsWith('xml:');
}

function findLast(array, test) {
  for (let i = array.length - 1; i >= 0; i--) if (test(array[i])) return i;
  return -1;
}

/** html, jsx or vue, from the text. */
export function guessKind(text) {
  if (/<template[\s>]/.test(text) && /\s(?:@[\w-]+|v-[\w-]+|:[\w-]+)=/.test(text)) return 'vue';
  if (/\bclassName=|=\{|from\s+['"]react['"]|useState\(|useEffect\(/.test(text)) return 'jsx';
  if (!/<[a-zA-Z]/.test(text)) return 'js';
  return 'html';
}
