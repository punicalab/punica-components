# The 2.0 contract

`@punica/components` is a library of framework-free custom elements. Every
element is `punica-<name>`, extends `PunicaElement` and follows the one
contract below. `npm run audit` and the shared contract test hold it; the
1.x token names are mapped in [`MIGRATION-2.0.md`](MIGRATION-2.0.md#tokens).

## Layout

| Path | What it is |
|---|---|
| `src/core/element.js` | `PunicaElement`, `define`, `sheet`, `uid`, `installTokens` |
| `src/core/form.js` | `FormControl(Base)` mixin: a real form control through ElementInternals |
| `src/core/a11y.js` | `nextIndex`, `setRovingTabindex`, `createTypeahead`, `firstFocusable`, `deepActiveElement`, `isRtl` |
| `src/core/overlay.js` | `Overlay` (top layer + anchoring) and `overlayCss` |
| `src/core/icons.js` | The glyphs components draw themselves, as static SVG markup |
| `src/tokens/tokens.css` | Every `--punica-*` design token, light-dark pairs, in `@layer punica.tokens` |
| `src/components/<dir>/<name>.js` + `.css` | One element per file, its styles beside it |
| `src/components/<dir>/<dir>.test.js` | Contract and behaviour tests, run in Chromium |
| `test/contract.js` | `contract(tag, options)`, `fixture`, `settle`, `once`, `a11y`, `cleanup` |
| `scripts/build.mjs` | `dist/esm` (per component), `dist/punica-components.min.js` (global `Punica`), `dist/tokens.css` |
| `src/index.js` | Generated barrel; never edit |

References to read before writing a component: `src/components/button/`
(a form-associated control over a native element) and
`src/components/popover/` (a top-layer panel).

## The contract

**Module.** An ES module that exports `class Punica<Name> extends
PunicaElement` and ends with `define('punica-<name>', Punica<Name>)`.
Nothing at module top level touches `document` or `window`. No globals.
A `.css` import is the file's text: `import styles from './x.css'`.

**Declarations.** `static properties`, `static styles`, `static template`
(static author-written markup; data never goes into it), `static
shadowOptions` (`{ delegatesFocus: true }` when the element wraps a
focusable control). A light-DOM element sets `static shadow = false`.

**Lifecycle.** The constructor may only build and wire its own shadow tree:
it never reads or writes attributes or light-DOM children. `connected()`
runs on every connect; anything attached outside the shadow tree (window,
document, observers, timers) is attached there with `this.listen(...)` or
`{ signal: this.signal }` and observers/timers are undone in
`disconnected()`. `update(changed)` runs once per microtask and brings the
shadow tree in line with the properties; on the first run `changed` holds
every property. An element that is removed and appended again works exactly
as before. Never override `connectedCallback`, `disconnectedCallback` or
`attributeChangedCallback`.

**Properties and attributes.** Declared in `static properties`; never
hand-written accessors for attribute-backed state. Multi-word attributes
are kebab-case (`fullWidth` ↔ `full-width`). Booleans follow HTML: present
is true, `disabled="false"` is still disabled. `null` removes the
attribute. Data (arrays, objects, functions) is a property with
`attribute: false`. The shared names, used wherever the concept occurs:
`value`, `checked`, `open`, `selected`, `disabled`, `readonly`, `required`,
`name`, `label` (accessible name), `placeholder`, `orientation`
(`horizontal | vertical`), `size` (`small | medium | large`), `variant`,
`color` (`primary | secondary | error | warning | info | success |
neutral`), `multiple`, `min`, `max`, `step`.

**Events.** Only through `this.emit(name, detail)`, which dispatches
`punica-<name>`, bubbling and composed. No element fires a synthetic event
under a native name; native `click`, `focus`, `keydown` pass through on
their own. The vocabulary:

| Event | When | `detail` |
|---|---|---|
| `punica-input` | the value changes while the user is still editing | `{ value }` |
| `punica-change` | the user committed a new value | `{ value }`, plus `{ checked }` for a toggle |
| `punica-select` | the user picked an item of a list or menu | `{ value, item }` |
| `punica-open` / `punica-close` | a surface opened / closed | close: `{ reason }` |
| `punica-toggle` | a disclosure expanded or collapsed | `{ open }` |
| `punica-dismiss` | the user dismissed a chip, alert, toast | `{}` |

A programmatic property change fires nothing. A `cancelable` event that is
prevented stops the default action.

**Forms.** Anything a person enters a value into extends
`FormControl(PunicaElement)`: it calls `setFormValue` and `setValidity`
from `update()`, implements `formReset()` and `formRestore(state)`, and
reads `isDisabled`. The `value` attribute is the default value and the
`value` property is the current one (`reflect: false`). Enter in a
single-line text control calls `this.form?.requestSubmit()`.

**Accessibility.** A real native element inside the shadow root when one
exists for the job (`<button>`, `<input>`, `<dialog>`), with
`delegatesFocus`. Otherwise role and ARIA state through `this.internals`
(`internals.role`, `internals.ariaChecked`) and the WAI-ARIA APG keyboard
pattern, with Home and End, from `src/core/a11y.js`. Every interactive
element is reachable and operable by keyboard, shows `:focus-visible`
with `outline: var(--punica-focus-ring)`, and has an accessible name from
its content or `label`. No English strings in a component: a string a
person may read or hear is an attribute with an English default
(`label-close="Close"`). Dates and numbers through `Intl` with the
element's language (`this.closest('[lang]')?.lang || navigator.language`).

**Surfaces.** A floating surface is a `popover="manual"` element in the
component's own shadow root placed by `Overlay`, or a `<punica-popover>`
the component composes. A modal surface is a native `<dialog>` opened with
`showModal()`. Nothing is appended to `document.body`, nothing uses a
global id or a z-index token.

**Styles.** `:host` sets `display` and declares the component's public
custom properties as `--punica-<component>-<property>`, each defaulting to
a token. Private working values are `--_name`. Every colour, space, radius,
shadow, duration and font comes from a `--punica-*` token in
`src/tokens/tokens.css`; a hex or rgb literal is a defect. Variants read
attributes (`:host([variant='outlined'])`), states read
`:state(checked)` set by `this.toggleState('checked', on)`. Every element a
consumer may restyle carries `part="..."`. Logical properties only
(`inline-size`, `padding-inline`, `inset-inline-start`); no `left`/`right`.
Motion uses the duration tokens, which are zero under
`prefers-reduced-motion`; a `@media (forced-colors: active)` block keeps
borders and focus visible. No `!important` except `[hidden]`. The host
never receives inline styles from its own code.

**Text.** Data reaches the DOM through `textContent`, attributes or DOM
construction. `innerHTML` is assigned only in `static template`.

**Docs.** A JSDoc block on the class with `@element`, one `@attr` per
attribute, `@prop` for property-only state, `@slot`, `@fires`, `@csspart`,
`@cssprop`, `@cssstate`; every public method documented. Slot names are
kebab-case; `start` and `end` name leading and trailing content.

**Tests.** `<dir>.test.js` calls `contract('punica-<name>', { html })` for
every element in the folder, then tests behaviour: keyboard, events with
their `detail`, form submission and reset for a form control, each defect
of the 1.x element the audit named. Run `npx vitest run src/components/<dir>`.
