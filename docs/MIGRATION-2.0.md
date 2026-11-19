# Migrating from 1.x to 2.0

2.0 is a clean break. Tags, attributes, events, slots and tokens were all
brought to one contract ([`contract.md`](contract.md)), so a page written for 1.x needs
changes. `node scripts/codemod-2.0.mjs <dir>` lists what it would rewrite
and what a person has to move; `--write` applies the rewrites.

## What the codemod does

| | |
|---|---|
| Rewrites | Design tokens, and the tags renamed one to one (below) |
| Reports | Removed tags, 1.x event names, 1.x attribute and slot spellings, the global `Toast`, the `build.min.js` script, z-index and breakpoint tokens |
| Leaves alone | Everything already in 2.0 form; running it twice changes nothing |

## Loading

| 1.x | 2.0 |
|---|---|
| `<script src="build.min.js">` (a concatenation, global `PunicaBase`) | `import '@punica/components'` (every element), or `import '@punica/components/components/button/button.js'` (one), or `<script src="dist/punica-components.min.js">` (global `Punica`) |
| Tokens from the host's own `light.css` / `dark.css` on `:root` | Built in: the first element adopts the token sheet in `@layer punica.tokens`. Override any `--punica-*` with an ordinary rule; set `color-scheme` on `:root` or a subtree for light and dark. `data-punica-no-tokens` on `<html>` skips the built-in sheet; `@punica/components/tokens.css` is the same sheet as a file |
| Hand-written `src/types/*.d.ts` | Generated from `custom-elements.json`: `@punica/components` (elements, `HTMLElementTagNameMap`) and `@punica/components/react` (JSX) |
| Loading the bundle twice throws | Every `define` is guarded |

## What changed everywhere

- **Events are `punica-*`**, bubbling and composed, through one vocabulary:
  `punica-input`, `punica-change`, `punica-select`, `punica-open`,
  `punica-close`, `punica-toggle`, `punica-dismiss`. No element fires a
  synthetic `change`, `input`, `focus`, `blur`, `close` or `select`. A change
  made from script fires nothing.
- **Booleans follow HTML**: `disabled="false"` is disabled. `null` removes an
  attribute; 1.x wrote the string `"null"`.
- **Multi-word attributes are kebab-case** (`fullwidth` → `full-width`).
- **Slots** `startIcon` / `endIcon` / `startAdornment` / `endAdornment` are
  `start` / `end`.
- **Every value control is a form control**: in `FormData`, reset, validated,
  disabled by a fieldset. The `value` attribute is the default; the property
  is the current value.
- **Overlays open in the top layer.** Nothing is appended to `<body>`, no
  `--zindex-*` token exists.
- **Text is text.** No attribute or data value is parsed as HTML.
- **`label`** is the accessible name; visible strings a component draws
  itself are `label-*` attributes with English defaults.

## Tags

| 1.x | 2.0 |
|---|---|
| `punica-tab`, `punica-tab-item` | `punica-tabs`, `punica-tab` |
| `punica-select-item` | `punica-option` |
| `punica-list-view`, `punica-list-view-item` | `punica-list`, `punica-list-item` |
| `punica-progress-line` | `punica-progress-bar` |
| `punica-modal`, `-header`, `-content`, `-footer` | `punica-dialog`, `-header`, `-content`, `-footer` |
| `punica-single-select-list`, `-item` | `punica-listbox`, `punica-listbox-item` |
| `punica-multi-select-list`, `-item` | `punica-listbox multiple`, `punica-listbox-item` |
| `punica-context-menu-item`, `-separator` | `punica-menu-item slot="menu"`, `punica-menu-divider` |
| `punica-accordion-summary`, `-details` | the accordion's `summary` slot and default slot |
| `punica-alert-icon`, `-content`, `-action` | the alert's `icon` slot, default slot, `actions` slot |
| `punica-typography` | `punica-heading` (with `level`) or `punica-text` (with `variant`) |
| `window.Toast` | `import { toast } from '@punica/components'` |

## Tokens

Colours are `light-dark()` pairs. Every 1.x token and its 2.0 name:

| 1.x | 2.0 |
|---|---|
| `--<palette>-main` / `-light` / `-dark` | `--punica-color-<palette>` / `-light` / `-dark` |
| `--background-main`, `--background-paper` | `--punica-color-bg`, `--punica-color-surface` |
| `--backdrop-light`, `--background-backdrop` | `--punica-color-hover`, `--punica-color-backdrop` |
| `--text-primary`, `--text-placeholder` | `--punica-color-text`, `--punica-color-text-placeholder` |
| `--neutral-main` as a border | `--punica-color-border` |
| `--disabled`, `--highlight` | `--punica-color-text-muted` with `--punica-disabled-opacity`, `--punica-color-focus` |
| `--white`, `--black` | `--punica-color-on-accent` on an accent, else `--punica-color-white` / `-black` |
| `--root-border-radius`, `--root-padding` | `--punica-radius`, `--punica-padding` |
| `--spacing-N` | `--punica-space-N` |
| `--box-shadow-S` | `--punica-shadow-S` |
| `--weight-W` | `--punica-font-weight-W` |
| `--fontFamily` | `--punica-font-family` |
| `--disabled-opacity` | `--punica-disabled-opacity` |
| `--zindex-*` | gone: overlays use the top layer |
| `--break-points-*` | container queries, or the literal widths 600 / 900 / 1200 / 1536 px in `@media` |

## Per element

One table per element, 1.x beside 2.0, with every attribute, property,
event, slot, part and custom property:

| Family | Document |
|---|---|
| Button, input, textarea, checkbox, switch, toggle button, radio, slider, number input, file input, field, segmented control | [`migration/form-basic.md`](migration/form-basic.md) |
| Select, option, calendar, date and time pickers, range and date-time inputs, autocomplete, tokenizer | [`migration/pickers.md`](migration/pickers.md) |
| Popover, tooltip, menu, context menu, dialog, drawer, toast, split button, hover card, bottom sheet, lightbox, command palette | [`migration/overlays.md`](migration/overlays.md) |
| Tabs, accordion, collapsible, listbox, list, pagination, button group, split, breadcrumbs, stepper, tree, carousel, overflow list | [`migration/navigation.md`](migration/navigation.md) |
| Alert, banner, avatar, badge, box, card, chip, container, divider, grid, hidden, icon, paper, progress bar, QR code, skeleton, toolbar, app bar, heading, text, spinner, link, kbd, status dot, empty state, stack, center, aspect ratio, scroll area, visually hidden | [`migration/display.md`](migration/display.md) |
| Agenda, virtual list, virtual table | [`migration/data.md`](migration/data.md) |
| Side nav, top nav, table, code, code block, timestamp, timer (new) | [`migration/content.md`](migration/content.md) |
| Chat family, markdown, citation (new) | [`migration/chat.md`](migration/chat.md) |

`punica-button` and `punica-popover`:

| | 1.x | 2.0 |
|---|---|---|
| Button slots | `startIcon`, `endIcon` | `start`, `end` |
| Button attributes | `rounded` (has a radius), `fullwidth`, `underline` | radius by default, `pill`, `full-width`; `underline` is gone (use `punica-link`) |
| Button defaults | none: an unstyled host without `variant`, `color` and `size` | `filled`, `primary`, `medium` |
| Button colour | `ghost` | `variant="text"` |
| Button in a form | `type` did nothing | `type="submit"` / `reset` act on the form, with `name` and `value` |
| Button keyboard | not focusable | a native button inside, `delegatesFocus` |
| Popover position | `top` / `left` attributes measured once by the caller | `side`, `align`, `offset`, anchored to the `trigger` slot, `for`, or the `anchor` property; follows scroll and resize |
| Popover open | caller shows and hides it and owns dismissal | `open`, `show()`, `hide()`; outside press and Escape close it unless `manual`; `punica-open`, `punica-close` |
