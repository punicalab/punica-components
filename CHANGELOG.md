# @punica/components

## 2.6.1

### Patch Changes

- ae88c36: The API an assistant reads (`@punica/components/ai`, the MCP server) answers two more questions an assistant searched the type declarations for:
  - `search_components` gives the import and typed signature of a function an element's module exports (`confirm(options?: { heading?, message?, … }): Promise<boolean>` beside `punica-alert-dialog`), not only its name; `search()` returns them as `signatures`.
  - `get_component` has an "In React (JSX)" section: `import type {} from '@punica/components/react'` types the tags, attribute spellings, and the element's own event written as `on<event>` with its typed `CustomEvent` detail.

## 2.6.0

### Minor Changes

- 5f84fda: Every event that documents its `detail` now has it typed: 129 of the 162 events, written as `@fires {{ value: string }} punica-change - ...` on the element. The event maps in `index.d.ts` and the `onpunica-*` props in `react.d.ts` take it (`CustomEvent<{ value: string | string[] | null }>` instead of `CustomEvent<any>`), and `get_component` of the MCP server shows it in a Detail column. Close reasons of the dialogs and drawers list their values and still take any string, since `requestClose(reason)` names its own. The 33 events that carry no detail stay `any`.
  
  `confirm()`, `toast()` and `qrMatrix()` are now declared at the top of `index.d.ts` as `export declare function`, where a look at the file finds them; they were declared at its end.

## 2.5.2

### Patch Changes

- `search()` of the assistant API (`@punica/components/ai`, `search_components` of the MCP server) names the functions of an element's folder with each result, `confirm()` on `punica-alert-dialog` and `toast()` on `punica-toast`, and counts their names in the match, so an assistant finds them before it reads the element.

## 2.5.1

### Patch Changes

- edc28e8: The API an assistant reads (`@punica/components/ai`, `get_component` of the MCP server) shows the functions an element's folder exports, with their import, typed signature and documentation: `confirm()` on `punica-alert-dialog`, `toast()` on `punica-toast` and `punica-toaster`, `qrMatrix()` on `punica-qr-code`. They were only named in the descriptions, so an assistant searched the type declarations for them.

## 2.5.0

### Minor Changes

- d49223d: The tokens ship as Design Tokens (the W3C Design Tokens Community Group format, 2025.10) for design tools and token pipelines: `@punica/components/tokens/light.tokens.json` and `dark.tokens.json`, one per colour scheme, generated from `tokens.css` at build. The `light-dark()` pairs are split into the two files; everything else is the same in both. Each token names its CSS custom property in `$extensions["com.punicalab.css"]`; the focus ring is a `border` token that refers to its width and colour.
- 0209a34: Server-side rendering, experimental: `@punica/components/ssr` (`createRenderer`, `renderToString`) writes each element's shadow root into the HTML as Declarative Shadow DOM. A server-rendered page shows the elements styled before the script arrives, or without it, and nothing moves when they upgrade; what the user typed or checked before the script came is kept. It renders in Node, in a worker with happy-dom (an optional peer dependency).

### Patch Changes

- 79ac105: The global script (`dist/punica-components.min.js`, the CDN build) parses on a page that names no charset. A regex in `punica-outline` held combining marks as raw characters; a page without `<meta charset>`, served without a charset, read them as windows-1252 and the whole script failed (`Private field '#z' must be declared in an enclosing class`). The build now stops when the global script has a non-ASCII byte.

## 2.4.0

### Minor Changes

- 4eda532: The validator reads CSS too (`.css`, `.scss`, `.less`, and `<style>` or strings in other files) and warns of `display: contents` on a part that is, or holds, the native control an element is focused through (`punica-button::part(base)`, `punica-link::part(base)`, `punica-side-nav-item::part(base)`, …): with no box the element takes no focus and leaves the Tab order. The guide says so, says which controls hold `''` and which `null` when empty, and that Playwright's CSS locators reach the native controls inside the elements.

## 2.3.1

### Patch Changes

- 0534b3a: The guide says how a script submits right after setting a value (`await control.updateComplete` first: an assignment reaches the form at the end of the microtask), and points hand-drawn forms to `bindForm` of `@punica/form-kit/dom`. A new test suite holds the form controls (`punica-input`, `-textarea`, `-select`, `-checkbox`, `-number-input`, `punica-button`) to what their native counterparts do in a form, side by side: default values, reset, the first enabled option, the empty option, required, custom errors, disabled fieldsets, `form.elements`, Enter, the Tab order and the submitter.

## 2.3.0

### Minor Changes

- `punica-month-picker`: a month field, what `<input type="month">` is in every browser. Its value is `yyyy-mm`; the field writes the month and year in the language's order (`03/2026`, `03.2026`, `2026/03`) and reads them typed that way, ISO, or with the year on either side; its button opens the twelve months of a year (arrows, Home/End, PageUp/PageDown for the year). `min`, `max`, `disabledMonths`, `required`, `name`, form reset and `<fieldset disabled>` as on the date picker; `punica-input-group` takes it as a field.
- `punica-button` shows keyboard focus on the element as `:state(focus-visible)`: the element matches `:focus` but never `:focus-visible` while its native button has focus, so a page that draws the button with a class of its own (its box, its ring) had no way to show the ring for the keyboard only.
- 67d4392: `punica-field` describes its control to assistive technology: its help and the error it shows become the control's `description` (new on `punica-input`, `-textarea`, `-select` and `-checkbox`, read as `aria-description` on the inner control) or `aria-description` on a native control, unless the control has its own. Those four controls set `aria-invalid` on their inner control once touched and invalid for any reason, an error set with `setCustomValidity` included (`punica-select` said it only for a missing value). `punica-select` and `punica-checkbox` count as touched when reported invalid (a submit, `checkValidity()`, `reportValidity()`), as the text controls already did.
- `punica-chip variant="soft"`: a tint of the colour under its shade, for a status or a tag that should not shout; readable in light and dark for every colour.
- `punica-button type="submit"` is its form's default button when it is the first submit button: Enter in a native field of one line submits through it (once), and a disabled one blocks it, as a native default button does. A form whose submit button was a `punica-button` lost Enter once it had two fields.
- A modal dialog, drawer, alert dialog or sheet focuses its content's `autofocus` control when it opens, as its documentation says; the browser looked only at the dialog's own descendants, not at what its slots show. Where the browser would put focus on no control (a content tall enough to scroll made the panel a stop), it focuses the content's first control.
- `punica-input`, `-textarea`, `-select` and `-checkbox` (and the pickers that share `fieldName`) are named by an `aria-label` written on the element, as `punica-button` is; `label` wins, then `aria-label`, then the `<label>`s that point at them. A control named the usual way outside a field (a row of inputs) was read without a name.
- `punica-button` names its native button from an `aria-label` written on the element (as it already passes `aria-expanded`, `aria-pressed` and the rest); `label` wins when both are set. An icon-only button named the usual way was read without a name.
- `punica-section` takes the space between its heading and its description from `--punica-section-heading-gap` (4px as before).
- An option or a segment whose value is the empty string is a choice, as on a native select or radio ("Any client", "All"): `punica-select` shows it and submits it (and, required, counts it as no answer, as a native select does); `punica-radio-group` and `punica-segmented-control` select it. With no such item the empty string is still nothing chosen.
- A single `punica-select` with no default (no `value`, no option marked `selected`) and no `placeholder` takes its first enabled option, as a native select does: it showed nothing and its value was `null`, so a form moved from a native select submitted nothing where it had submitted the first choice. To start empty, give it a `placeholder`.
- `punica-select` is as wide as its widest option (and its placeholder), as a native select is, and narrower when its container is, with the value ending in an ellipsis. It took the width of the value it showed, so picking another option resized it, and a form moved from a native select drew it narrower.
- `punica-field report="inline"`: a submit shows the field's message alone, without the browser's bubble beside it, and focuses the first invalid control of the form as the browser would (`checkValidity()` still moves no focus). With the default, `browser`, a page that shows errors under its fields got each message twice.
- `punica-autocomplete show-value`: the field shows a picked option's value instead of its label, as a native input with a `<datalist>` does; typing finds an option by its value or its label, and a row from `options` shows the value with the label beside it (`option-label` part). For a code picked by its code or its name (an account, a partner).
- `punica-segmented-control` can wrap onto more lines: `--punica-segmented-control-wrap: wrap`; its indicator is placed on the chosen segment's box, so it follows it to another line.

### Patch Changes

- An element's shadow root no longer starts and ends with the whitespace of its template: in an element laid out inline (`punica-link`, a chip drawn inline) it was text, drawn as a space beside the element's own ("Production : Jasper" for `<punica-link>Production</punica-link>: Jasper`).
- `punica-link` shows keyboard focus on the element as `:state(focus-visible)`, as `punica-button` does: the element matches `:focus` but never `:focus-visible` while its anchor has focus, so a page that draws the link with a class of its own (a card, a row) had no way to show its ring for the keyboard only.
- `punica-collapsible` leaves a click cancelled inside its trigger (`preventDefault()`, a copy button in a heading row) as it is, as `<summary>` does: it opened or closed anyway.

- A toast shown while a modal dialog, drawer or sheet is open is above it and can be clicked: the toaster moves into the topmost open modal surface and back when it closes (everything outside a modal is inert and under it in the top layer). A toast's countdown and its bar go on across the move.

- 6422cf4: A custom error (`setCustomValidity`) on a form control is added to what is wrong with its value (`badInput`, `valueMissing`, …) instead of replacing it, as on a native control: `validity.badInput` stayed false while a message was set.
- `punica-empty-state` gives no place to its icon, description and actions while their slots are empty: each added the gap around it, so a heading alone stood 8px taller than its padding and text.
- `punica-field` takes its line height from `--punica-field-line-height` (1.43 by default, as before), so a page can set it like the field's other properties instead of overriding the element's `line-height`.
- A property the element gives a default (`value` of `punica-input`, `type` of `punica-button` …) is typed without `| null`: it never holds null. The generated typings made every non-boolean attribute nullable.
- Every element's type has `updateComplete` (the promise of its pending update): the generated typings listed only a class's own members, so TypeScript refused it on every element.
- 6901c2f: `punica-input` follows a validity that changes while its value does not: a half-typed number or date (`badInput`) reads as an empty value throughout, and the element kept reporting itself valid.

## 2.2.0

### Minor Changes

- f393a44: `punica-components info <tag> --brief`, and `formatMarkdown(tag, { brief: true })` of `@punica/components/ai`: an element's API without what only styling needs (CSS parts, custom properties, states), about a quarter shorter over the library. For an assistant that writes markup it is what the whole API was read for. `get_component` of the MCP server takes `brief: true` for the same.

### Patch Changes

- f484d89: The guide says how the elements are used with Punica Form and Punica Request (forms through the kit, messages and confirmations) and points to an application on the three.

## 2.1.1

### Patch Changes

- 602f7ef: `toast`, `confirm` and `qrMatrix` are in the type declarations. They were exported and described in the guide, but an `import { toast } from '@punica/components'` did not compile in TypeScript. Imports from `@punica/components/components/*` are typed as well.
  
  The guide says how to find the elements in tests: their roles come from `ElementInternals`, which Playwright's and Testing Library's `getByRole` and some rules of axe-core do not read yet.

## 2.1.0

### Minor Changes

- 96f47d3: Tools for AI assistants and editors: `npx punica-components search|info|guide|validate`, `@punica/components/ai` (the elements' API and a markup validator), `dist/llms.txt` and `dist/llms-full.txt`, an agent skill in `skills/punica-components`, VS Code custom data and JetBrains web-types, and the `@punica/components-mcp` server.

## 2.0.0

A clean break from 1.x: every element was rewritten to one contract
([`docs/contract.md`](docs/contract.md)). Moving a 1.x page over is
[`docs/MIGRATION-2.0.md`](docs/MIGRATION-2.0.md), and
`node scripts/codemod-2.0.mjs <dir>` does the mechanical part.

### Breaking

- Loading: ES modules (`import '@punica/components'` or one element at a
  time) and a global script `dist/punica-components.min.js` (global `Punica`)
  replace `build.min.js`.
- Events are `punica-*`, bubbling and composed; no element fires a synthetic
  native event, and a change made from script fires nothing.
- Booleans follow HTML (`disabled="false"` is disabled), multi-word attributes
  are kebab-case, `startIcon` / `endIcon` slots are `start` / `end`.
- Design tokens are `--punica-*`, built in, with `light-dark()` pairs; the
  host page no longer ships `light.css` / `dark.css`.
- Removed or renamed elements are listed in the migration guide
  (`punica-typography` became `punica-heading` and `punica-text`, for one).

### Added

- 163 elements, among them chat, data table, tree, pickers, navigation,
  command palette and the rest of the families in the docs.
- Every element that takes a value is a real form control (`ElementInternals`:
  `FormData`, reset, validation, `<fieldset disabled>`, labels).
- Keyboard operation by the WAI-ARIA APG patterns, `:state()` and `::part()`
  for restyling, right-to-left through logical properties, overlays in the
  top layer.
- `custom-elements.json`, generated TypeScript types for the elements and for
  React JSX.
