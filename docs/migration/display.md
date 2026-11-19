# Display and layout: 1.x → 2.0

Thirty-five elements in thirty folders. Twenty-four replace a 1.x element,
eleven are new. One table per element; `—` in the 1.x column means the
thing did not exist, in the 2.0 column that it is gone.

What changed everywhere, and is not repeated in each table:

- Every element is an ES module on `PunicaElement`. Nothing registers on a
  global and nothing needs the 1.x `PunicaBase` script loaded first.
- Attributes are kebab-case and booleans follow HTML: `fullwidth` is
  `full-width`, and `disabled="false"` is still disabled.
- Roles and ARIA state are set through `ElementInternals`. 1.x wrote `role`
  and `aria-*` attributes on the host; 2.0 leaves the host's attributes to
  you. Read `el.internals.role` in a test.
- No element writes an inline style on its host. 1.x `color="#f00"` on an
  avatar, a progress line or a typography wrote `style="..."`; 2.0 `color`
  takes a palette name only (`primary | secondary | error | warning | info |
  success | neutral`), and anything else is a custom property.
- No attribute value reaches a stylesheet as text. Numbers are parsed, names
  are matched by attribute selectors, lengths are checked with
  `CSS.supports`, and the result is set through the CSSOM on a sheet of the
  instance.
- Tokens are `--punica-*` (see the token map in [`MIGRATION-2.0.md`](../MIGRATION-2.0.md#tokens)). Every
  component custom property is `--punica-<element>-<property>`.
- `left`/`right` are gone: placement names and styles are logical.

## Removed elements

| 1.x | 2.0 |
|---|---|
| `punica-alert-icon`, `punica-alert-content`, `punica-alert-action` | Slots of `punica-alert`: `icon`, default, `actions` |
| `punica-progress-line` | `punica-progress-bar` |
| `punica-typography` | `punica-heading` for `variant="headline1..6"`, `punica-text` for the rest |

---

## punica-alert

`alert/alert.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-alert` with `punica-alert-icon`, `punica-alert-content`, `punica-alert-action` children | `punica-alert` alone |
| Attribute | `severity`: `error \| info \| success \| warning` | `color`: the same four plus `primary \| secondary \| neutral`; `info` by default |
| Attribute | `variant`: `standard \| outlined \| filled` | `variant`: `tinted \| outlined \| filled`; `tinted` (the old `standard`) by default |
| Attribute | — | `dismissible`: shows a close button |
| Attribute | — | `label-close`: name of the close button, `Close` |
| Property | `variant`, `severity` | `variant`, `color`, `dismissible`, `labelClose` |
| Method | — | `dismiss()`: what the close button does |
| Event | — | `punica-dismiss`, detail `{}`, cancelable. Unless prevented the alert sets `hidden` on itself |
| Slot | default (the three child elements) | default: the message |
| Slot | `punica-alert-icon` | `icon`. Empty, it shows the glyph of the colour (`info`, `success`, `warning`, `error`) |
| Slot | `punica-alert-action` | `actions` |
| Part | — | `icon` (the default glyph), `content`, `actions`, `close` |
| Role | none | `alert` for `error` and `warning`, `status` otherwise |
| Custom property | `--alert-border-radius` | `--punica-alert-radius` |
| Custom property | `--alert-padding` | `--punica-alert-padding` |
| Custom property | — | `--punica-alert-gap` |
| Removed | The tinted variant drew the message in the palette's main colour on its light tint | It draws `-dark` on `-light`, which meets 4.5:1 |
| Removed | `:host[class*='variant-outlined']`, a selector that never matched, so outlined had no border | Outlined has a border in the accent |

## punica-banner (new)

`banner/banner.js`. A page-level message bar. It extends `PunicaAlert`: the
attributes, slots, parts, close button, role and event are the alert's.

| | 2.0 |
|---|---|
| Attribute | `color`, `variant`, `dismissible`, `label-close`, as on `punica-alert` |
| Method | `dismiss()` |
| Event | `punica-dismiss`, detail `{}`, cancelable |
| Slot | default, `icon`, `actions` |
| Part | `icon`, `content`, `actions`, `close` |
| Role | `alert` for `error` and `warning`, `status` otherwise |
| Custom property | `--punica-banner-padding` |
| Custom property | `--punica-banner-max-width`: caps the message so a wide bar reads as a centred line |
| Layout | Full inline size, square corners, a line on the block-end edge only, content centred |

## punica-avatar

`avatar/avatar.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-avatar` | `punica-avatar` |
| Attribute | — | `src`: the picture. 1.x took a slotted `<img>` |
| Attribute | — | `name`: gives the initials (first letter of the first and last word, upper-cased in the element's language) while the picture is missing or fails, and the accessible name |
| Attribute | — | `label`, `alt`: accessible name; `label` wins over `alt`, which wins over `name` |
| Attribute | `variant`: `rounded \| circular` | `shape`: `circle \| square`; `circle` by default. 1.x had no default, so an avatar with no `variant` was a square |
| Attribute | — | `size`: `small \| medium \| large` (28, 36, 44 px); 1.x was 36 px only |
| Attribute | `color`: a palette name or any CSS colour, written to `style` | `color`: a palette name; `neutral` by default |
| Slot | default: an `<img>` or text | default: shown only with no picture and no name, for an icon |
| Slot | — | `status`: a mark at the block-end inline-end corner, outside the clip |
| Part | — | `base`, `image`, `initials`, `status` |
| State | — | `image`, `initials` |
| Role | none | `img` with the name when there is one |
| Custom property | — | `--punica-avatar-size`, `--punica-avatar-radius`, `--punica-avatar-background`, `--punica-avatar-color` |
| Removed | A slotted `<img>` filling the avatar | Use `src`. A slotted element still shows as the fallback but is not stretched |
| Removed | Any CSS colour in `color` | `--punica-avatar-background` |

## punica-badge

`badge/badge.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-badge` | `punica-badge` |
| Attribute | `badgecontent`: a number | `content`: a number or a short text |
| Attribute | `max`: 9 by default; a count equal to `max` already read `9+` | `max`: 99 by default; only a count above `max` reads `99+` |
| Attribute | `size`: `small` drew a dot, `medium` a count; with neither nothing sized | `dot`: boolean. A count is the default |
| Attribute | — | `show-zero`: a count of 0 is hidden without it |
| Attribute | `color`: `primary \| error \| info \| warning \| success`; no background without it | `color`: the full palette; `primary` by default |
| Attribute | — | `placement`: `block-start-inline-end` (default) `\| block-start-inline-start \| block-end-inline-end \| block-end-inline-start`; mirrored in RTL |
| Attribute | — | `label`: what assistive technology reads in place of the bare count |
| Property | `badgecontent` (number) | `content` (string), `showZero` |
| Slot | default | default; with nothing slotted the badge sits in the text line |
| Part | `badge-content` | `badge` |
| State | — | `standalone` |
| Custom property | — | `--punica-badge-background`, `--punica-badge-color`, `--punica-badge-size`, `--punica-badge-dot-size` |
| Formatting | `innerText = count` | `Intl.NumberFormat` in the element's language |
| Fixed | The template was appended again on every connect | Cloned once |

## punica-box

`box/box.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-box` | `punica-box` |
| Attribute | `border`, `rounded`, `error` | The same |
| Attribute | `fullwidth`, `fullheight` | `full-width`, `full-height` |
| Attribute | — | `padding`: a step of the spacing scale (`16` → `--punica-space-16`); anything else is ignored |
| Property | `fullwidth`, `fullheight` | `fullWidth`, `fullHeight`, `padding` (number) |
| Slot | default | default |
| Custom property | `--box-border-radius` | `--punica-box-radius` |
| Custom property | — | `--punica-box-border-color`, `--punica-box-padding` |
| Fixed | The template was appended again on every connect | Cloned once |

## punica-card

`card/card.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-card` | `punica-card` |
| Attribute | `rounded` | — ; a card is rounded. `--punica-card-radius: 0` squares it |
| Attribute | `fullwidth` | — ; a card is `display: block` (1.x was `inline-block`) |
| Attribute | — | `variant`: `elevated \| outlined \| filled`; `elevated` by default. 1.x had no shadow and no border |
| Attribute | — | `interactive`: the whole card is one native `<button>` |
| Attribute | — | `href`, `target`, `rel`: with `interactive`, the card is one native `<a>`. `noopener` is added for `_blank`; a `javascript:` URL is dropped and the card stays a button |
| Attribute | — | `disabled`: for an interactive card |
| Attribute | — | `label`: accessible name of an interactive card |
| Method | — | `focus()`, `click()` reach the inner control of an interactive card |
| Event | — | none of its own; the native `click` passes through |
| Slot | default | default |
| Part | — | `base`: the `div`, `button` or `a` |
| Custom property | `--card-border-radius` | `--punica-card-radius` |
| Custom property | `--card-background-color` | `--punica-card-background` |
| Custom property | — | `--punica-card-shadow`, `--punica-card-border-color` |

## punica-card-header

`card/cardHeader.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-card-header` | `punica-card-header` |
| Slot | default | default: the title |
| Slot | — | `subtitle`, `start`, `end` |
| Part | — | `title`, `subtitle` |
| Custom property | — | `--punica-card-header-padding`, `--punica-card-header-gap` |
| Layout | A padded block | A row: `start`, title over subtitle, `end` |

## punica-card-content

`card/cardContent.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-card-content` | `punica-card-content` |
| Slot | default | default |
| Custom property | — | `--punica-card-content-padding` |

## punica-card-actions

`card/cardActions.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-card-actions` | `punica-card-actions` |
| Attribute | — | `align`: `start \| end \| between`; `end` by default, as in 1.x |
| Slot | default | default |
| Custom property | — | `--punica-card-actions-padding`, `--punica-card-actions-gap` (8 px; 1.x was 4 px) |
| Layout | `nowrap` | Wraps |

## punica-card-media

`card/cardMedia.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-card-media` | `punica-card-media` |
| Slot | default: an `<img>` | default: an `<img>`, `<video>` or `<picture>` |
| Custom property | — | `--punica-card-media-height`, `--punica-card-media-fit` |

## punica-chip

`chip/chip.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-chip` | `punica-chip` |
| Attribute | `color`: `default \| primary \| error \| info \| success \| warning` | `color`: the palette; `default` is now `neutral` |
| Attribute | `variant`: `filled \| outlined` | The same |
| Attribute | `size`: `small \| medium` | The same |
| Attribute | — | `removable`: shows a remove button |
| Attribute | — | `label-remove`: name of the remove button, read before the chip's text; `Remove` |
| Attribute | — | `selectable`: the chip is a native toggle button with `aria-pressed` |
| Attribute | — | `selected` |
| Attribute | — | `disabled` |
| Method | — | `focus()` |
| Event | — | `punica-change`, detail `{ selected }`, when the user toggles a selectable chip |
| Event | — | `punica-dismiss`, detail `{}`, cancelable, from the remove button or Delete / Backspace on the chip. Unless prevented the chip sets `hidden` on itself |
| Slot | default | default |
| Slot | `delete`: your own delete control | — ; use `removable` |
| Slot | — | `start` |
| Part | — | `base`, `label`, `remove` |
| State | — | `selected` |
| Custom property | — | `--punica-chip-height`, `--punica-chip-padding`, `--punica-chip-radius` |
| Removed | `size`, `color` and `variant` were written onto the host as attributes on connect | Defaults live in the stylesheet; the host's attributes are yours |

## punica-container

`container/container.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-container` | `punica-container` |
| Attribute | `maxwidth`: `xs \| sm \| md \| lg \| xl`; no limit without it | `max-width`: `sm \| md \| lg \| xl \| full`; `lg` by default. `full` is the old "no attribute" |
| Attribute | `disablegutters` | `gutters`: `none \| small \| medium \| large`; `medium` by default |
| Property | `maxwidth`, `disablegutters` | `maxWidth`, `gutters` |
| Slot | default | default |
| Custom property | — | `--punica-container-max-width`, `--punica-container-gutter` |
| Removed | `maxwidth="xs"` (444 px) | `--punica-container-max-width: 444px` |
| Removed | The limit applied only from its own breakpoint up | It always applies |

## punica-divider

`divider/divider.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-divider` | `punica-divider` |
| Attribute | `orientation`: `horizontal \| vertical`, written onto the host on connect | `orientation`; `horizontal` by default, nothing written |
| Attribute | `flexItem`: observed in camelCase, so it never fired | — ; `--punica-divider-spacing` is the margin it meant |
| Attribute | — | `decorative`: `role=presentation` |
| Attribute | — | `inset`: indents both inline ends |
| Slot | — | default: a label in the middle of the line |
| Part | — | `line`, `label` |
| State | — | `labelled` |
| Role | none | `separator` with `aria-orientation`, named by the label |
| Custom property | — | `--punica-divider-color`, `--punica-divider-width`, `--punica-divider-spacing`, `--punica-divider-inset` |

## punica-row

`grid/row.js` (1.x `grid/gridRow.js`).

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-row` | `punica-row` |
| Attribute | `spacing`, in units of 8 px | `spacing`: a number 0 to 64, in units of 8 px |
| Attribute | `rowspacing`, `columnspacing` | `row-spacing`, `column-spacing` |
| Attribute | `direction`: any `flex-direction` text | `direction`: `row \| row-reverse \| column \| column-reverse` |
| Attribute | `justifycontent`: any `justify-content` text | `justify`: `start \| center \| end \| between \| around \| evenly` |
| Attribute | `alignitems`: any `align-items` text | `align`: `start \| center \| end \| stretch \| baseline` |
| Attribute | `wrap`: any `flex-wrap` text | `wrap`: `wrap \| nowrap \| wrap-reverse`; `wrap` by default |
| Attribute | `justifyitems`, `aligncontent` | — |
| Attribute | `fullheight` | `full-height` |
| Property | lower-case names | `rowSpacing`, `columnSpacing`, `fullHeight` |
| Slot | default | default |
| Custom property | `--row-spacing`, `--column-spacing`, `--columns` and five more, written into a `<style>` | `--punica-row-row-gap`, `--punica-row-column-gap`, `--punica-row-columns` |
| Fixed | Attribute values were interpolated into `<style>` text | Numbers are parsed and range-checked, keywords are matched by attribute selectors |
| Changed | — | The row is a size container (`container-type: inline-size`): its columns answer to the row's width. In a shrink-to-fit parent give the row an inline size |

## punica-col

`grid/col.js` (1.x `grid/gridCol.js`).

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-col` | `punica-col` |
| Attribute | `xs`, `sm`, `md`, `lg`, `xl`: any text, written into a `<style>` | The same names; an integer 1 to 12, anything else is ignored |
| Attribute | `size` (a getter with no effect) | — |
| Breakpoints | Viewport media queries at 0 / 600 / 900 / 1200 / 1536 px | Container queries on the row at the same widths |
| Behaviour | A column with no span had `flex-grow: 0` | It shares the space left on its line |
| Slot | default | default |
| Fixed | A new `<style>` per attribute change, built from attribute text | Private custom properties on a sheet of the instance |

## punica-hidden

`hidden/hidden.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-hidden` | `punica-hidden` |
| Attribute | `direction="up"` with `breakPoint` | `above`: hidden from that breakpoint up |
| Attribute | `direction="down"` with `breakPoint` | `below`: hidden under that breakpoint |
| Attribute | — | `only`: hidden from that breakpoint to the next |
| Breakpoints | `xs` 444, `sm` 600, `md` 900, `lg` 1200, `xl` 1536 px | `xs` 0, `sm` 600, `md` 900, `lg` 1200, `xl` 1536 px |
| Mechanism | A `matchMedia` listener that mounted or emptied the shadow root | Media queries in the stylesheet; the element is `display: contents` or `display: none` |
| Fixed | `breakPoint` was observed in camelCase and never fired; the media listener was never removed | No listener exists |
| Changed | The content was removed from the tree | The content stays in the DOM, undrawn and out of the accessibility tree |

## punica-icon

`icon/icon.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-icon` | `punica-icon` |
| Attribute | — | `name`: a glyph of `src/core/icons.js` (`chevronDown`, `chevronUp`, `chevronEnd`, `chevronStart`, `close`, `check`, `minus`, `plus`, `search`, `calendar`, `clock`, `more`, `info`, `warning`, `error`, `success`, `upload`, `copy`). An unknown name draws nothing |
| Attribute | — | `label`: the icon is `role=img` with that name. Without it the icon is hidden from assistive technology |
| Attribute | `size`: `xsmall \| small \| medium \| large \| xlarge \| 2xlarge` | The same |
| Attribute | `color`: `primary` and `secondary` pointed at tokens that did not exist | `color`: the palette |
| Slot | default: an icon-font element or an SVG | The same; still works |
| Part | — | `icon`: the SVG of a named glyph |
| Custom property | — | `--punica-icon-size`, `--punica-icon-color` |

## punica-paper

`paper/paper.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-paper` | `punica-paper` |
| Attribute | `rounded` | `radius`: `none \| small \| medium \| large \| full`; `medium` by default, so a paper is rounded unless `radius="none"` |
| Attribute | — | `elevation`: 0 to 5, the shadow tokens `xs` to `xl`; 0 by default |
| Attribute | — | `variant`: `elevated \| outlined` |
| Attribute | — | `padding`: a step of the spacing scale |
| Attribute | `class` (observed) | — |
| Slot | default | default |
| Custom property | `--paper-border-radius` | `--punica-paper-radius` |
| Custom property | `--paper-padding` | `--punica-paper-padding` |
| Custom property | — | `--punica-paper-background`, `--punica-paper-shadow` |
| Fixed | The template was appended again on every connect | Cloned once |

## punica-progress-bar

`progressBar/progressBar.js` (1.x `progressLine/progressLine.js`).

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-progress-line` | `punica-progress-bar` |
| Attribute | — | `value`: 0 to `max`. Without it the bar is indeterminate, which is all 1.x could be |
| Attribute | — | `max`: 100 by default |
| Attribute | — | `label`: accessible name |
| Attribute | `height`: any CSS text, written to `style` | `size`: `small \| medium \| large` (2, 4, 8 px) |
| Attribute | `color`: any CSS colour, written to `style` | `color`: the palette |
| Attribute | — | `show-value`: the percentage beside the bar, formatted by `Intl.NumberFormat` in the element's language |
| Part | — | `track`, `indicator`, `value` |
| State | — | `indeterminate` |
| Role | none | `progressbar` with `aria-valuemin`, `-max`, `-now`, `-valuetext` |
| Custom property | `--progress-height` | `--punica-progress-bar-height` |
| Custom property | `--progress-color` | `--punica-progress-bar-color` |
| Custom property | `--progress-bg` | `--punica-progress-bar-track-color` |
| Custom property | `--indeterminate-duration` | — |
| Motion | Always sweeps | Under reduced motion a full bar fades in and out |
| Fixed | The template was appended again on every connect | Cloned once |

## punica-qr-code

`qrCode/qrCode.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-qr-code` | `punica-qr-code` |
| Attribute | `value` | `value`, encoded as UTF-8 |
| Attribute | `size`: any number | `size`: px, 16 to 4096; 128 by default (1.x 256, which only set a canvas of fixed 232 px) |
| Attribute | — | `error-correction`: `L \| M \| Q \| H`; `M` by default |
| Attribute | — | `label`: accessible name; the value itself without it |
| Attribute | `background`, `foreground`: any CSS colour | — ; custom properties |
| Export | — | `qrMatrix(text, level)`: the symbol as rows of booleans, or `null` when the text does not fit |
| Rendering | A `<canvas>` | One SVG `<path>`, sharp at any size |
| Part | — | `base` |
| State | — | `empty` |
| Role | none | `img` |
| Custom property | — | `--punica-qr-code-size`, `--punica-qr-code-foreground`, `--punica-qr-code-background` |
| Fixed | **1.x did not encode anything.** It drew three finder patterns and two timing lines on a fixed 21×21 grid whatever the value, so no scanner could read it | A full encoder: byte mode, versions 1 to 40, Reed–Solomon error correction, the eight masks scored by the standard's penalty rules. The test suite reads the output back with the platform `BarcodeDetector` |
| Fixed | A new canvas was appended on every connect | One SVG |

## punica-skeleton

`skeleton/skeleton.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-skeleton` | `punica-skeleton` |
| Attribute | `variant`: `text \| circular` | `variant`: `text \| circle \| rect`; `text` by default |
| Attribute | `width`, `height`: any text, written to `style` | `width`, `height`: one CSS length the browser accepts (`CSS.supports('width', v)`); anything else is ignored |
| Attribute | `rounded` | — ; `--punica-skeleton-radius` |
| Attribute | — | `lines`: 1 to 50 bars for `text`; the last of several is 60 % wide |
| Slot | default | — |
| Part | — | `line` |
| Accessibility | none | Hidden from assistive technology |
| Custom property | — | `--punica-skeleton-color`, `--punica-skeleton-radius` |
| Motion | Always pulses | Still under reduced motion |

## punica-toolbar

`toolbar/toolbar.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-toolbar` | `punica-toolbar` |
| Attribute | `variant`: `dense \| regular` (48, 64 px) | `size`: `small \| medium \| large` (48, 64, 80 px); `medium` by default |
| Attribute | `disablegutters` | — ; `--punica-toolbar-padding: 0` |
| Attribute | — | `label`: accessible name |
| Attribute | — | `orientation`: `horizontal \| vertical` |
| Slot | default | default, `start`, `end` |
| Part | — | `content` |
| Role | `role="div"`, which is not a role | `toolbar`, with `aria-orientation` |
| Keyboard | none | One tab stop. Arrow keys along the orientation (mirrored in RTL), Home and End move between the enabled controls of all three slots; a text field keeps its own arrow keys |
| Custom property | — | `--punica-toolbar-size`, `--punica-toolbar-padding`, `--punica-toolbar-gap` |
| Changed | — | The toolbar sets `tabindex` on its controls (roving tabindex) |

## punica-app-bar

`appBar/appBar.js`.

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-app-bar` | `punica-app-bar` |
| Attribute | `position`: `fixed \| absolute \| sticky \| static \| relative`; `fixed` by default | `position`: `static \| sticky \| fixed`; `static` by default |
| Attribute | `color`: the palette, `transparent`, `inherit`; `primary` by default | `color`: the palette; `primary` by default. `neutral` is the surface colour with a line under it |
| Slot | default | default, `start`, `end` |
| Part | — | `content` |
| Role | `role="header"`, which is not a role | `banner` |
| Layout | A column | A row: `start`, content (fills), `end` |
| Stacking | `z-index: 1000` | `--punica-z-sticky` / `--punica-z-fixed` |
| Custom property | — | `--punica-app-bar-background`, `--punica-app-bar-color`, `--punica-app-bar-shadow`, `--punica-app-bar-padding`, `--punica-app-bar-gap` |
| Removed | `position="absolute"`, `position="relative"` | Position the host yourself |
| Removed | `color="transparent"`, `color="inherit"` | `--punica-app-bar-background` |
| Removed | A fixed bar was pinned to the right edge only (`left: auto; right: 0`) | It spans the inline axis |

## punica-heading

`heading/heading.js`. Replaces `punica-typography variant="headline1..6"`.

| | 1.x (`punica-typography`) | 2.0 |
|---|---|---|
| Tag | `punica-typography` | `punica-heading` |
| Attribute | `variant="headline1"` … `headline6` set both the size and `aria-level` | `level`: 1 to 6, the rank in the outline; 2 by default and for anything else |
| Attribute | — | `size`: `xsmall \| small \| medium \| large \| xlarge \| 2xlarge`, independent of the level. Unset, it follows the level: 34, 24, 20, 18, 16, 14 px |
| Attribute | `truncate="N"` | `truncate`: boolean, one line with an ellipsis |
| Attribute | `textalign`: `left \| right \| center \| justify` | `align`: `start \| center \| end \| justify` |
| Attribute | `fontweight`, `whitespace`, `color` | — ; `--punica-heading-font-weight`, `--punica-heading-color` |
| Slot | default | default |
| Role | `role` and `aria-level` attributes written on connect, never updated | `heading` and the level through internals, kept in step |
| Custom property | — | `--punica-heading-font-size`, `--punica-heading-font-weight`, `--punica-heading-line-height`, `--punica-heading-color` |
| Changed | `headline1` was 6rem, `headline2` 3.75rem, `headline3` 3rem | The scale tops out at 2.125rem; set `--punica-heading-font-size` for display type |

## punica-text

`text/text.js`. Replaces the other variants of `punica-typography`.

| | 1.x (`punica-typography`) | 2.0 |
|---|---|---|
| Tag | `punica-typography` | `punica-text` |
| Attribute | `variant`: `subtitle1 \| subtitle2 \| body1 \| body2 \| button \| caption \| overline`, `body1` written onto the host on connect | `variant`: `body \| caption \| label \| overline \| code`; `body` by default, nothing written |
| Attribute | — | `size`: `small \| medium \| large`; `body2` and `subtitle2` are `size="small"` |
| Attribute | `fontweight`: `thin \| regular \| medium \| semi-bold \| bold \| extra-bold` | `weight`: the same plus `light` |
| Attribute | `textalign`: `left \| right \| center \| justify` | `align`: `start \| center \| end \| justify` |
| Attribute | `color`: a palette name or any CSS colour, written to `style` | `color`: the palette plus `muted`; inherited by default |
| Attribute | `truncate="N"`, written into a `<style>` on connect and never updated | `truncate`: lines before the ellipsis, an integer 1 to 99; the bare attribute is one line. Anything else is ignored |
| Attribute | `whitespace` | — ; set `white-space` on the host |
| Attribute | — | `block`: lays out as a block. 1.x body text was always a block; 2.0 text is inline unless `block`, `align` or `truncate` is set |
| Slot | default | default |
| State | — | `truncated` |
| Custom property | — | `--punica-text-font-size`, `--punica-text-line-height` |
| Removed | `variant="button"` | `variant="label"`, or a `punica-button` |
| Fixed | `truncate` went into a style string as it was | It is parsed to an integer and set through the CSSOM |
| Fixed | The template was appended again on every connect | Cloned once |

---

## New elements

### punica-spinner

`spinner/spinner.js`.

| | 2.0 |
|---|---|
| Attribute | `size`: `small \| medium \| large` (16, 24, 40 px) |
| Attribute | `color`: the palette; `primary` by default |
| Attribute | `label`: accessible name, `Loading` by default |
| Attribute | `decorative`: hidden from assistive technology |
| Part | `base` |
| Role | `progressbar` with no value, named by `label` |
| Custom property | `--punica-spinner-size`, `--punica-spinner-color`, `--punica-spinner-track-color`, `--punica-spinner-width` |
| Motion | Under reduced motion the ring stands still and fades in and out |

### punica-link

`link/link.js`. A native `<a part="base">` in the shadow root, with
`delegatesFocus`.

| | 2.0 |
|---|---|
| Attribute | `href`. A `javascript:` or `vbscript:` URL is dropped |
| Attribute | `target`, `download`, as on `<a>` |
| Attribute | `rel`; `noopener` is added for `target="_blank"` |
| Attribute | `variant`: `default \| subtle` (the surrounding text colour) |
| Attribute | `color`: the palette; `primary` by default |
| Attribute | `underline`: `always \| hover \| none`; `always` by default |
| Attribute | `external`: an icon after the text and a visually hidden text |
| Attribute | `label-external`: that text, `external link` by default |
| Attribute | `disabled`: no `href`, `aria-disabled="true"`, out of the tab order |
| Attribute | `label`: accessible name, for a link with no text |
| Method | `focus()`, `click()` |
| Event | none of its own; the native `click` passes through |
| Slot | default |
| Part | `base`, `external-icon` |
| Custom property | `--punica-link-color`, `--punica-link-color-hover` |

### punica-kbd

`kbd/kbd.js`. A native `<kbd>` holding one `<kbd>` per key.

| | 2.0 |
|---|---|
| Attribute | `keys`: keys joined by `+` (`Mod+Shift+K`). `Mod` is ⌘ on Apple platforms and `label-mod` elsewhere; a trailing `++` is the plus key |
| Attribute | `label-mod`: what `Mod` reads as off Apple platforms, `Ctrl` by default |
| Slot | default: one key, when `keys` is not set |
| Part | `base`, `key` |
| Custom property | `--punica-kbd-background`, `--punica-kbd-border-color`, `--punica-kbd-radius` |
| Platform | Read from `navigator.userAgentData?.platform \|\| navigator.platform` on every connect |

### punica-status-dot

`statusDot/statusDot.js`.

| | 2.0 |
|---|---|
| Attribute | `color`: the palette; `neutral` by default |
| Attribute | `pulse`: a ring pulses around the disc; still under reduced motion |
| Attribute | `label`: the dot is `role=img` with that name. Without it the dot is hidden from assistive technology |
| Part | `base` |
| Custom property | `--punica-status-dot-size` (6 px), `--punica-status-dot-color` |

### punica-empty-state

`emptyState/emptyState.js`.

| | 2.0 |
|---|---|
| Attribute | `heading`: the one line that says what is missing |
| Attribute | `heading-level`: 1 to 6; 3 by default |
| Attribute | `size`: `panel \| section`; `panel` fills and centres in its container, `section` is compact |
| Slot | default: the description |
| Slot | `icon`, `actions` |
| Part | `icon`, `heading`, `description`, `actions` |
| Custom property | `--punica-empty-state-padding`, `--punica-empty-state-gap`, `--punica-empty-state-max-width`, `--punica-empty-state-icon-size` |

### punica-visually-hidden

`visuallyHidden/visuallyHidden.js`.

| | 2.0 |
|---|---|
| Attribute | `focusable`: the content shows while focus is inside it, for a skip link |
| Slot | default |

### punica-aspect-ratio

`aspectRatio/aspectRatio.js`.

| | 2.0 |
|---|---|
| Attribute | `ratio`: `inline/block` as two positive numbers (`16/9`), or one number; `1/1` by default and for anything else |
| Slot | default; the content fills the box |
| Custom property | `--punica-aspect-ratio-fit`: `object-fit` of the content, `cover` |

### punica-stack

`stack/stack.js`.

| | 2.0 |
|---|---|
| Attribute | `direction`: `vertical \| horizontal`; `vertical` by default |
| Attribute | `gap`: a step of the spacing scale (`16` → `--punica-space-16`); 8 by default, anything off the scale is ignored |
| Attribute | `align`: `start \| center \| end \| stretch \| baseline` |
| Attribute | `justify`: `start \| center \| end \| between \| around \| evenly` |
| Attribute | `wrap`: boolean |
| Attribute | `divider`: a line between children |
| Slot | default |
| Custom property | `--punica-stack-gap`, `--punica-stack-divider-color` |

### punica-center

`center/center.js`.

| | 2.0 |
|---|---|
| Attribute | `axis`: `both \| inline \| block`; `both` by default |
| Attribute | `inline`: an inline box as wide as its content |
| Slot | default |

### punica-scroll-area

`scrollArea/scrollArea.js`. Give the element a `block-size` or
`max-block-size` (an `inline-size` when horizontal) to scroll within.

| | 2.0 |
|---|---|
| Attribute | `orientation`: `vertical \| horizontal \| both`; `vertical` by default |
| Attribute | `label`: accessible name; the scrolling box is then `role=region` |
| Property | `viewport` (read-only): the scrolling box, for `scrollTo()` and scroll listeners |
| Slot | default |
| Part | `viewport`, `shadow-start`, `shadow-end` |
| State | `scrollable`, `scroll-start`, `scroll-end` |
| Keyboard | While the content overflows and holds nothing focusable, the viewport has `tabindex="0"` so arrow keys and Page Up / Down scroll it |
| Custom property | `--punica-scroll-area-shadow-size`, `--punica-scroll-area-shadow-color`, `--punica-scroll-area-thumb-color` |
| Shadows | Scroll-driven animations where the browser has them (`animation-timeline` and `timeline-scope`); elsewhere the states above drive them. With `orientation="both"` only the block axis has shadows |
