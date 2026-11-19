# Migrating overlays, menus and dialogs from 1.x to 2.0

2.0 is a clean break. Every surface here now opens in the top layer (a
`popover="manual"` element or a native `<dialog>`) inside the component's own
shadow root: nothing is appended to `document.body`, no `--zindex-*` token
exists, and every listener on `document` is removed when the surface closes or
the element is disconnected.

Rules that hold for every element below:

- Booleans follow HTML: `open="false"` is open. Remove the attribute, or set
  the property to `false`.
- Events are `punica-*`, bubble and are composed. No element fires `close`,
  `select` or any other native-looking name any more.
- A string a person reads or hears is an attribute with an English default
  (`label-close="Close"`).
- Text given through an attribute or property is rendered as text. 1.x parsed
  several of them as HTML.
- 1.x tokens map as in [`MIGRATION-2.0.md`](../MIGRATION-2.0.md#tokens) (`--background-paper` →
  `--punica-color-surface`, `--spacing-8` → `--punica-space-8`, …).

Removed tags: `punica-modal`, `punica-modal-header`, `punica-modal-content`,
`punica-modal-footer`, `punica-context-menu-item`,
`punica-context-menu-separator`.

New tags: `punica-menu-checkbox-item`, `punica-menu-radio-group`,
`punica-menu-radio-item`, `punica-menu-divider`, `punica-menu-group`,
`punica-hover-card`, `punica-bottom-sheet`, `punica-lightbox`,
`punica-command-palette`, `punica-command-group`, `punica-command-item`.

---

## punica-tooltip

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-tooltip` | `punica-tooltip` |
| Attributes | `text` (parsed as HTML, read once at connect) | `text` (plain text, live), `open`, `side` (`block-start` default, `block-end`, `inline-start`, `inline-end`), `align` (`center` default, `start`, `end`), `delay` (ms, 300), `offset` (px, 6), `disabled` |
| Properties | `text` | one per attribute, plus `panel` (read-only) |
| Methods | none | `show()`, `hide()` |
| Events | none | `punica-open`; `punica-close` `{ reason: 'pointer' \| 'blur' \| 'escape' \| 'api' }` |
| Slots | default: the trigger | default: the trigger; `content`: the description, in place of `text` |
| Parts | none | `panel`, `text` |
| CSS custom properties | none | `--punica-tooltip-radius`, `-padding`, `-background`, `-color`, `-shadow`, `-max-width` |
| Behaviour | CSS `:hover` only, always above the trigger, clipped by any `overflow: hidden` ancestor | opens on hover after `delay` and on keyboard focus; closes on pointer leave, blur and Escape; stays while the pointer is on the tooltip; flips when there is no room |
| Accessibility | none | `role="tooltip"`; the trigger is described by the tooltip: `ariaDescribedByElements` pointing at the `content` slot's elements, or `aria-description` holding `text` (a reference from the trigger into the tooltip's shadow tree is dropped by browsers, so `text` always takes the `aria-description` path) |
| Removed | `position: relative; display: inline-block; cursor: pointer` on the host (it is `display: contents` now); HTML in `text` (use the `content` slot) | |

## punica-menu

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-menu` | `punica-menu` |
| Attributes | `open`, `left`, `top`, `bottom`, `width`, `height`, `placement` (the caller measured its own trigger) | `open`, `label`, `side` (`block-end` default), `align` (`start` default), `offset` (px, 4) |
| Properties | one per attribute | one per attribute, plus `anchor` (element), `point` (`{ x, y }`), `items` and `panel` (read-only) |
| Methods | `show()`, `hide()` | `show({ focus })`, `hide(reason)`, `toggle()`, `reposition()` |
| Events | `menu-item-click` `{ value: textContent, data: data-item }`; `close` | `punica-select` `{ value, item }` (cancelable: preventing it keeps the menu open); `punica-open`; `punica-close` `{ reason: 'select' \| 'escape' \| 'outside' \| 'tab' \| 'api' }` |
| Slots | default: `punica-menu-item` (cloned into `<body>`) | default: the items (never cloned); `trigger`: the menu button |
| Parts | none | `panel` |
| CSS custom properties | none (styles were injected into `<body>`) | `--punica-menu-radius`, `-padding`, `-background`, `-shadow`, `-min-width`, `-max-width`, `-max-height` |
| Keyboard | Escape | APG menu button: Enter, Space, ArrowDown, ArrowUp on the trigger open; arrows, Home, End, type-ahead; Enter and Space activate; ArrowRight / ArrowLeft open and close a submenu (mirrored in RTL); Escape closes and returns focus; Tab closes |
| Accessibility | none | `role="menu"`, named by `label` or the trigger; the trigger gets `aria-haspopup="menu"` and `aria-expanded` |
| Removed | `left`, `top`, `bottom`, `width`, `height`, `placement`; the `#menu` element and `<style>` in `<body>`; the transparent backdrop; `data-item` (use `value`, or read `detail.item`) | |

`detail.value` is the item's `value` attribute, or its text when it has none.
Events of a submenu bubble through its parents; `event.target` is the menu
they came from.

## punica-menu-item

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-menu-item` | `punica-menu-item` |
| Attributes | `value`, `disabled`, `role` (written by the element), `aria-disabled` | `value`, `disabled` |
| Properties | `value`, `disabled` | `value`, `disabled`, `submenu` and `labelText` (read-only) |
| Events | native `click` on a clone | none of its own; the menu fires `punica-select` |
| Slots | default | default: label; `start`; `end` (a shortcut); `submenu`: a `punica-menu` this item opens |
| Parts | none | `label`, `submenu-icon` |
| CSS custom properties | none | `--punica-menu-item-radius`, `-padding`, `-highlight` |
| States | none | `:state(has-submenu)`, `:state(submenu-open)` |
| Accessibility | `role="menuitem"` attribute | `role` through ElementInternals; `aria-haspopup` and `aria-expanded` for a submenu; a disabled item is skipped by the keyboard |

### New siblings

| Tag | Attributes | Events | Slots | Parts / CSS |
|---|---|---|---|---|
| `punica-menu-checkbox-item` | `checked`, `value`, `disabled` | `punica-change` `{ value, checked }`, then the menu's `punica-select` | default, `start`, `end` | `indicator`, `label`; `--punica-menu-checkbox-item-indicator-color`; `:state(checked)` |
| `punica-menu-radio-group` | `value`, `label` | `punica-change` `{ value }` | default: radio items | `label` |
| `punica-menu-radio-item` | `value`, `checked`, `disabled` | none; the group fires `punica-change` | default, `start`, `end` | `indicator`, `label`; `--punica-menu-radio-item-indicator-color`; `:state(checked)` |
| `punica-menu-group` | `label` | none | default: items | `label` |
| `punica-menu-divider` | none | none | none | `--punica-menu-divider-color` |

## punica-context-menu

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-context-menu` with `punica-context-menu-item` and `punica-context-menu-separator` | `punica-context-menu` with `punica-menu-item` and its siblings, each given `slot="menu"` |
| Target | `target="<selector>"`, resolved against the document | the default slot: wrap the area in the element |
| Attributes | `target`, `disabled` | `label`, `open`, `disabled` |
| Item attributes | `value`, `label`, `icon` (parsed as HTML), `keyboard`, `disabled` | `punica-menu-item`: `value`, `disabled`; label is the content, icon the `start` slot, shortcut the `end` slot |
| Methods | `openAt(x, y)`, `close()` | `showAt({ x, y })`, `hide()` |
| Events | `punica-context-menu-select` `{ value, labels, path, originalEvent }` | `punica-select` `{ value, item }` (cancelable); `punica-open`; `punica-close` `{ reason }` |
| Slots | default: the items | default: the target area; `menu`: the items |
| Parts | none | `menu` (the inner `punica-menu`), `panel` (exported) |
| CSS custom properties | `--punica-context-menu-bg`, `-color`, `-border-color`, `-radius`, `-shadow`, `-padding`, `-font`, `-min-width`, `-max-width`, `-separator-color`, `-separator-margin`, `-icon-column`, `-icon-size`, `-icon-opacity`, `-item-gap`, `-item-padding`, `-item-radius`, `-item-hover-bg`, `-item-hover-color` | the menu's: `--punica-menu-background`, `-radius`, `-shadow`, `-padding`, `-min-width`, `-max-width`, `-max-height`; the item's: `--punica-menu-item-padding`, `-radius`, `-highlight`; `--punica-menu-divider-color` |
| Opens on | `contextmenu` on the targets | `contextmenu` at the pointer; Shift+F10 and the ContextMenu key beside the focused element, focus on the first item |
| Submenus | nested `punica-context-menu-item` | a `punica-menu` in an item's `submenu` slot |
| Removed | `target`; `detail.labels`, `detail.path`, `detail.originalEvent`; the `icon` attribute; three `window` listeners (scroll, resize, pointerdown) that were never removed; closing on scroll (the menu now follows) | |

## punica-dialog

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-dialog`, `punica-dialog-header`, `-content`, `-footer` | the same four |
| Attributes | `open`, `width` (px), `rounded` | `open`, `label`, `size` (`small` 320px, `medium` 440px, `large` 720px), `modeless`, `no-light-dismiss`, `no-close-button`, `label-close` (`Close`) |
| Properties | `open`, `width`, `rounded` | one per attribute, plus `returnValue` (read-only) |
| Methods | none | `show()`, `hide(returnValue)`, `requestClose(reason, returnValue)` |
| Events | none | `punica-open`; `punica-request-close` `{ reason }` (cancelable); `punica-close` `{ reason: 'escape' \| 'backdrop' \| 'close-button' \| 'api', returnValue }` |
| Slots | default | default |
| Parts | none | `dialog`, `panel`, `close-button` |
| CSS custom properties | `--dialog-border-radius`, `--dialog-padding`, `--dialog-background-color`, `--dialog-backdrop-background-color` | `--punica-dialog-radius`, `--punica-dialog-padding`, `--punica-dialog-background`, `--punica-dialog-backdrop`, plus `--punica-dialog-shadow`, `--punica-dialog-width` |
| `punica-dialog-header` | a slot | `role="heading"`, `level` (2); it names the dialog unless `label` does |
| `punica-dialog-content` | a slot | scrolls; `--punica-dialog-content-padding` |
| `punica-dialog-footer` | a slot | `--punica-dialog-footer-gap` |
| Behaviour | `open` in the markup threw (showModal before connect); Escape closed the native dialog and left `open` set; a backdrop click did nothing | `open` works in markup; Escape, the backdrop and the close button keep `open` in step; focus returns to the opener; the dialog survives being moved while open |
| Removed | `width` (use `size` or `--punica-dialog-width`); `rounded` (always rounded; set `--punica-dialog-radius: 0` for square corners) | |

## punica-modal → punica-dialog

`punica-modal` is gone. It was a `<div>` with a hand-made backdrop: no focus
trap, no inert background, no Escape.

| 1.x | 2.0 |
|---|---|
| `<punica-modal>` | `<punica-dialog>` |
| `<punica-modal-header>`, `-content`, `-footer` | `<punica-dialog-header>`, `-content`, `-footer` |
| `open` | `open` |
| `rounded` | removed: always rounded; `--punica-dialog-radius` |
| `width`, `height` (any CSS length) | `size`, or `--punica-dialog-width`; height follows the content up to the viewport |
| `close` event on a backdrop click (the page had to remove `open` itself) | the dialog closes itself and fires `punica-close` `{ reason: 'backdrop', returnValue }`; prevent `punica-request-close` to keep it open, or set `no-light-dismiss` |
| `--modal-border-radius`, `--modal-padding`, `--modal-background-color`, `--modal-backdrop-background-color` | `--punica-dialog-radius`, `--punica-dialog-padding`, `--punica-dialog-background`, `--punica-dialog-backdrop` |

## punica-drawer

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-drawer` | `punica-drawer` |
| Attributes | `open`, `direction` (`left`, `right`, `top`, `bottom`), `size` (`small`, `medium`, `large`, `xlarge`, `2xlarge`, `fullSize`), `customsize`, `rounded` | `open`, `label`, `side` (`inline-end` default, `inline-start`, `block-start`, `block-end`), `size` (`small` 480px, `medium` 600px, `large` 900px), `no-light-dismiss`, `no-close-button`, `label-close` (`Close`) |
| Properties | one per attribute | one per attribute, plus `returnValue` (read-only) |
| Methods | none | `show()`, `hide(returnValue)`, `requestClose(reason, returnValue)` |
| Events | `close` on Escape or a backdrop click: a request, the page removed `open` itself | `punica-open`; `punica-request-close` `{ reason }` (cancelable); `punica-close` `{ reason: 'escape' \| 'backdrop' \| 'close-button' \| 'api', returnValue }`. The drawer closes itself |
| Slots | default | default: the body; `header`: the title, which names the drawer; `footer` |
| Parts | none | `dialog`, `header`, `body`, `footer`, `close-button` |
| CSS custom properties | `--drawer-background-color`, `--drawer-border-radius` | `--punica-drawer-background`, `--punica-drawer-radius` (0 by default), plus `--punica-drawer-size`, `-padding`, `-backdrop`, `-shadow` |
| Behaviour | a fixed `<div>`; a `document` keydown listener while closed; wrote `document.body.style.overflow` | a native `<dialog>` with `showModal()`: focus trap, inert page, Escape; no listener outside its shadow tree; the page's styles are not touched |
| Removed | `direction` (`left` → `inline-start`, `right` → `inline-end`, `top` → `block-start`, `bottom` → `block-end`); `customsize`, `xlarge`, `2xlarge`, `fullSize` (set `--punica-drawer-size`); `rounded` (set `--punica-drawer-radius`); the scroll lock on `<body>` | |

## punica-toast

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-toast` | `punica-toast` |
| Attributes | `title`, `message`, `variant` (`info`, `success`, `warning`, `error`, `neutral`), `duration` (ms; absent = stays), `dismissible`, `enter-from`, `leaving` | `color` (`neutral` default, `primary`, `secondary`, `error`, `warning`, `info`, `success`), `duration` (ms, 5000; 0 = stays), `no-close-button`, `label-close` (`Close`) |
| Content | `title` and `message` attributes | the default slot |
| Methods | `hide()` | `dismiss()` (fires nothing) |
| Properties | one per attribute | one per attribute, plus `paused` (read-only) |
| Events | `toast-close` after the exit animation | `punica-dismiss` `{ reason: 'user' \| 'timeout' }` when it starts to leave |
| Slots | none | default: the message; `start`: an icon; `action`: a button |
| Parts | none | `base`, `message`, `close-button`, `progress` |
| CSS custom properties | `--toast-border-radius`, `--toast-padding`, `--toast-duration`, `--toast-background`, `--toast-color` | `--punica-toast-radius`, `--punica-toast-padding`, `--punica-toast-background`, `--punica-toast-color`, plus `--punica-toast-shadow`, `--punica-toast-max-width`; the exit takes `--punica-duration-slow` |
| States | `[leaving]` attribute | `:state(leaving)`, `:state(paused)` |
| Behaviour | the countdown ran on an untracked timer and did not pause | pauses while hovered or focused; Escape on a focused toast dismisses it; the timer stops when the toast is removed |
| Removed | `title` (put a `<strong>` in the message); `message`; `variant` (→ `color`); `dismissible` (the close button shows unless `no-close-button`); `enter-from` | |

## punica-toaster

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-toaster` | `punica-toaster` |
| Attributes | none | `position` (`block-end-end` default, `block-end-center`, `block-end-start`, `block-start-end`, `block-start-center`, `block-start-start`), `label` (`Notifications`) |
| Methods | `push({ title, message, variant, duration, dismissible, placement })` | `add(message, { color, duration, labelClose, noCloseButton })` |
| Global | `window.Toast.show(options)`, `window.Toast.ensure()` | `import { toast } from '@punica/components'`: `toast(message, { color, duration, labelClose, noCloseButton, toaster })` returns the `punica-toast` |
| Slots | none (six fixed regions in the shadow tree) | default: the toasts |
| Parts | none | `region` |
| CSS custom properties | none | `--punica-toaster-gap`, `--punica-toaster-offset` |
| Placement | `placement` per toast: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right` | `position` on the toaster: `top` → `block-start`, `bottom` → `block-end`, `left` → `start`, `right` → `end`; use one toaster per position |
| Accessibility | none | `role="region"`, `aria-live="polite"`, named by `label`; in the top layer through `popover="manual"` only while it holds a toast |
| Removed | `window.Toast`; `push()`; `--zindex-popover`; a full-viewport fixed host | |

`toast()` uses the first `punica-toaster` in the document. When the page has
none it creates one and appends it to `<body>`; put a `<punica-toaster>` in
the page to choose where it lives.

## punica-split-button

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-split-button` holding a `punica-menu` | `punica-split-button` holding `punica-menu-item` children with `slot="menu"` |
| Attributes | `open`, `placement`, `disabled`, `variant`, `size`, `color`, `rounded`, `fullwidth`, `label`, `icon` | `variant`, `color`, `size`, `disabled`, `full-width`, `label` (accessible name of the primary button), `label-menu` (`More options`) |
| Properties | one per attribute | one per attribute, plus `menu` (the inner `punica-menu`, read-only) |
| Methods | `openMenu()`, `close()`, `toggle()` | `focus()`; `menu.show()`, `menu.hide()`, `menu.toggle()` |
| Events | `primary-click`; `select` `{ value: textContent, data }` | `punica-action` `{}`; `punica-select` `{ value, item }` (cancelable); `punica-open`; `punica-close` `{ reason }` |
| Slots | `label`: the primary label; default: a `punica-menu` | default: the primary label; `menu`: the items |
| Parts | none | `base`, `primary`, `toggle`, `menu` |
| CSS custom properties | none | `--punica-split-button-radius`, `-height`, `-padding` |
| Accessibility | a toggle button with a fixed English `aria-label` | two native buttons in a `role="group"`; the menu button has `aria-haspopup="menu"`, `aria-expanded` and its name from `label-menu` |
| Removed | `open` and `placement` (use `menu.open`, `menu.side`, `menu.align`); `rounded`; `icon`; `fullwidth` (→ `full-width`); the `label` slot (→ default slot) | |

---

## New in 2.0

### punica-hover-card

| | |
|---|---|
| Attributes | `label`, `open`, `side` (`block-end`), `align` (`start`), `delay` (ms, 400), `close-delay` (ms, 200), `offset` (px, 8), `disabled` |
| Methods | `show()`, `hide()` |
| Events | `punica-open`; `punica-close` `{ reason: 'pointer' \| 'blur' \| 'escape' \| 'api' }` |
| Slots | `trigger`; default: the panel's content |
| Parts | `panel` |
| CSS custom properties | `--punica-hover-card-radius`, `-padding`, `-background`, `-shadow`, `-max-width` |

### punica-bottom-sheet

| | |
|---|---|
| Attributes | `label`, `open`, `snap-points` (fractions of the viewport, `0.5 0.9`), `snap` (index, 0), `no-light-dismiss`, `label-handle` (`Sheet height`) |
| Methods | `show()`, `hide(returnValue)`, `requestClose(reason, returnValue)` |
| Events | `punica-open`; `punica-change` `{ value }` (the new `snap`); `punica-request-close` `{ reason }` (cancelable); `punica-close` `{ reason: 'escape' \| 'backdrop' \| 'drag' \| 'handle' \| 'api', returnValue }` |
| Slots | default: the body; `header`; `footer` |
| Parts | `dialog`, `handle`, `header`, `body`, `footer` |
| CSS custom properties | `--punica-bottom-sheet-radius`, `-padding`, `-background`, `-backdrop`, `-shadow`, `-max-width` |

### punica-lightbox

| | |
|---|---|
| Attributes | `label`, `open`, `index` (0), `no-light-dismiss`, `label-close` (`Close`), `label-previous` (`Previous image`), `label-next` (`Next image`) |
| Properties | `items` (`{ src, alt, caption }[]`), `length` and `returnValue` (read-only) |
| Methods | `show()`, `hide(returnValue)`, `requestClose(reason, returnValue)`, `previous()`, `next()` |
| Events | `punica-open`; `punica-change` `{ index }`; `punica-request-close` `{ reason }` (cancelable); `punica-close` `{ reason: 'escape' \| 'backdrop' \| 'close-button' \| 'api', returnValue }` |
| Slots | default: thumbnails, `<img>` elements or buttons holding one; an image may carry `data-full` and `data-caption` |
| Parts | `dialog`, `figure`, `image`, `caption`, `counter`, `previous-button`, `next-button`, `close-button` |
| CSS custom properties | `--punica-lightbox-background`, `-color`, `-control-background`, `-padding`, `-radius` |

### punica-command-palette, punica-command-group, punica-command-item

| | |
|---|---|
| Palette attributes | `label`, `open`, `placeholder`, `no-light-dismiss` |
| Palette properties | `query`, `items` (read-only), `activeItem` (read-only), `returnValue` (read-only) |
| Palette methods | `show()`, `hide(returnValue)`, `requestClose(reason, returnValue)` |
| Palette events | `punica-open`; `punica-input` `{ value }`; `punica-select` `{ value, item }` (cancelable); `punica-request-close` `{ reason }` (cancelable); `punica-close` `{ reason: 'select' \| 'escape' \| 'backdrop' \| 'api', returnValue }` |
| Palette slots | default: items and groups; `empty`: shown when nothing matches |
| Palette parts | `dialog`, `search`, `input`, `list`, `empty` |
| Palette CSS custom properties | `--punica-command-palette-radius`, `-background`, `-backdrop`, `-shadow`, `-width`, `-max-height` |
| Group | `label`; part `label`; `:state(filtered-out)` |
| Item attributes | `value`, `keywords`, `disabled` |
| Item slots | default: the label; `start`; `shortcut` |
| Item parts and CSS | `label`; `--punica-command-item-radius`, `-padding`, `-highlight`; `:state(active)`, `:state(filtered-out)` |
