# New in 2.0: navigation, table and content elements

None of these existed in 1.x, so there is nothing to migrate from. Each
table below is the element's whole public API. Every element extends
`PunicaElement`; every string a person reads or hears is an attribute with
an English default.

Folders: `sideNav/`, `topNav/`, `table/`, `code/`, `codeBlock/`,
`timestamp/`, `timer/`, `appShell/`, `mobileNav/`, `section/`, `outline/`. Each file defines one element; import the ones you
use.

## `punica-side-nav`

App navigation down the side: a native `<nav>` that collapses to a rail.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Accessible name of the landmark |
| Attribute | `collapsed` | Boolean; rail mode, icons only |
| Attribute | `label-collapse` | Name of the collapse button while expanded; `Collapse navigation` |
| Attribute | `label-expand` | Name of the collapse button while collapsed; `Expand navigation` |
| Event | `punica-toggle` | `{ open }`, when the user collapses or expands. Items and sections fire the same event for their own disclosure, so check `event.target` |
| Slot | default | Items and sections |
| Slot | `header` | Above the items |
| Slot | `footer` | Under the items |
| Part | `base`, `header`, `collapse-button`, `items`, `footer` | |
| Custom property | `--punica-side-nav-width` | Inline size expanded, `16rem` |
| Custom property | `--punica-side-nav-rail-width` | Inline size collapsed |
| Custom property | `--punica-side-nav-background`, `--punica-side-nav-padding` | |
| Keyboard | Arrow Up / Down, Home, End | Move between the items that are showing, in every slot; Tab works as usual |

## `punica-side-nav-section`

A named group of items.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Heading and accessible name of the group |
| Attribute | `collapsible` | Boolean; the heading is a button |
| Attribute | `collapsed` | Boolean; items hidden. Only with `collapsible`, and ignored in a rail |
| Event | `punica-toggle` | `{ open }` |
| Slot | default | `punica-side-nav-item` elements |
| Part | `base`, `heading`, `toggle`, `items` | |
| Custom property | `--punica-side-nav-section-gap`, `--punica-side-nav-section-color` | |
| State | `rail` | The navigation around it is collapsed |

## `punica-side-nav-item`

A native `<a>` with `href`, a native `<button>` without.

| | Name | Notes |
|---|---|---|
| Attribute | `href`, `target`, `rel` | Make and configure the link |
| Attribute | `current` | Boolean; `aria-current="page"` |
| Attribute | `disabled` | Boolean; no focus, no activation |
| Attribute | `open` | Boolean; nested items are showing |
| Attribute | `label-toggle` | Start of the name of a link item's expand button; `Toggle`, followed by the item's text |
| Property | `text` | Read-only; the label as text |
| Event | `punica-toggle` | `{ open }`, when the user expands or collapses nested items |
| Slot | default | The label |
| Slot | `start` | An icon; the only content showing in a rail |
| Slot | `end` | A badge |
| Slot | `children` | Nested items. A button item becomes the disclosure itself (`aria-expanded`); a link item gets a separate expand button |
| Part | `base`, `control`, `label`, `chevron`, `toggle`, `children`, `tooltip` | |
| Custom property | `--punica-side-nav-item-height`, `-radius`, `-padding`, `-indent`, `-current-background`, `-current-color` | |
| State | `rail`, `has-children` | |

In a rail the label stays the control's accessible name and opens beside the
item, in the top layer, on hover and on keyboard focus; Escape closes it.
Nested items are not shown in a rail.

## `punica-top-nav`

App navigation across the top. Items that do not fit move, last first, into
a menu behind a "more" button; the element measures with a `ResizeObserver`
and a `MutationObserver`, both stopped while it is out of the document.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Accessible name of the landmark |
| Attribute | `label-more` | Name of the overflow button; `More` |
| Property | `overflowing` | Read-only; the items in the overflow menu now |
| Event | `punica-open` | The overflow menu, or an item's own menu, opened |
| Event | `punica-close` | `{ reason }`: `escape`, `outside` or `api` |
| Slot | default | `punica-top-nav-item` elements |
| Slot | `start` | The brand |
| Slot | `end` | Actions |
| Part | `base`, `start`, `items`, `more-button`, `more-popover`, `more-menu`, `end` | |
| Custom property | `--punica-top-nav-height`, `-background`, `-padding`, `-gap` | |
| Keyboard | Arrow Down on the more button | Opens the menu and focuses its first item |
| Keyboard | Arrow Up / Down, Home, End, Escape in the menu | Move between items; Escape closes and returns focus to the button |

The shadow root uses manual slot assignment, so only element children are
placed (a bare text node directly inside the element is not shown), and the
element never writes an attribute on an item.

## `punica-top-nav-item`

A native `<a>` with `href`, a native `<button>` without, a disclosure button
when the `menu` slot has content.

| | Name | Notes |
|---|---|---|
| Attribute | `href`, `target`, `rel` | Make and configure the link; `href` is ignored while there is a menu |
| Attribute | `current` | Boolean; `aria-current="page"` |
| Attribute | `disabled` | Boolean |
| Attribute | `open` | Boolean; the menu is showing |
| Property | `text` | Read-only; the label as text |
| Event | `punica-open` | The menu opened |
| Event | `punica-close` | `{ reason }`: `escape`, `outside` or `api` |
| Slot | default | The label |
| Slot | `start`, `end` | An icon, a badge |
| Slot | `menu` | Dropdown content: links, buttons or further items, or one `punica-top-nav-mega-menu`, opened in a `punica-popover` |
| Part | `control`, `label`, `chevron`, `popover`, `menu` | |
| Custom property | `--punica-top-nav-item-height`, `-radius`, `-padding`, `-current-background`, `-current-color` | |
| State | `has-menu` | |
| State | `mega` | The menu is a `punica-top-nav-mega-menu`; the panel may be as wide as the viewport |
| Keyboard | Enter / Space, Arrow Down on the button | Open the menu; focus goes to its first entry |
| Keyboard | Arrow Up / Down, Home, End, Escape in the menu | Move between entries (mega menu items and a featured card's link included); Escape closes this menu only and returns focus |

## `punica-top-nav-mega-menu`

A wide panel of link columns for a `punica-top-nav-item`'s `menu` slot. The
item opens, closes and works it with the keyboard as it does any menu. A
container query on the panel puts the featured card under the columns
below 40rem. In `topNav/`.

| | Name | Notes |
|---|---|---|
| Slot | default | `punica-top-nav-mega-menu-group` elements, the columns |
| Slot | `featured` | A promotional card beside the columns: a `punica-top-nav-mega-menu-card` |
| Part | `base`, `groups`, `featured` | |
| Custom property | `--punica-top-nav-mega-menu-width` | Inline size, capped at the viewport; `56rem` |
| Custom property | `--punica-top-nav-mega-menu-column-width` | Narrowest a column gets before the columns wrap; `13rem` |
| Custom property | `--punica-top-nav-mega-menu-featured-width`, `-gap` | |

## `punica-top-nav-mega-menu-group`

One column: a heading over items. A `group` (through `ElementInternals`)
named by the heading; the visible heading is hidden from assistive
technology so it is not read twice.

| | Name | Notes |
|---|---|---|
| Attribute | `heading` | The column's title and the group's name |
| Slot | default | `punica-top-nav-mega-menu-item` elements |
| Part | `heading`, `items` | |
| Custom property | `--punica-top-nav-mega-menu-group-heading-color` | |

## `punica-top-nav-mega-menu-item`

A native `<a>` with `href`, a native `<button>` without; a title, a line
under it and an icon tile. Its accessible name is its visible text.

| | Name | Notes |
|---|---|---|
| Attribute | `href`, `target`, `rel` | Make and configure the link |
| Attribute | `description` | The line under the title |
| Attribute | `current` | Boolean; `aria-current="page"` |
| Attribute | `disabled` | Boolean; no focus, no activation, skipped by the arrow keys |
| Slot | default | The title |
| Slot | `start` | An icon |
| Slot | `description` | In place of the attribute |
| Part | `control`, `icon`, `label`, `description` | |
| Custom property | `--punica-top-nav-mega-menu-item-radius`, `-padding`, `-icon-background`, `-icon-color` | |

## `punica-top-nav-mega-menu-card`

A promotional card for the `featured` slot.

| | Name | Notes |
|---|---|---|
| Attribute | `heading` | The title |
| Attribute | `image`, `image-alt` | An image over the title; decorative (`alt=""`) unless `image-alt` says what it shows |
| Attribute | `href`, `link-label` | The card's link and its text; the text is the title by default |
| Slot | default | The text under the title |
| Part | `base`, `image`, `body`, `heading`, `link` | |
| Custom property | `--punica-top-nav-mega-menu-card-background`, `-radius`, `-image-ratio` | |

## `punica-table`

A table whose rows and cells are elements the author writes. Roles are set
through `ElementInternals` (`table`, `rowgroup`, `row`, `columnheader`,
`cell`) and the layout is CSS `display: table*`. The table sorts and filters
nothing.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Accessible name |
| Attribute | `caption` | Visible caption; the accessible name unless `label` is set |
| Attribute | `dense`, `striped`, `dividers` | Booleans |
| Attribute | `sticky-header` | Boolean; the header sticks inside the nearest scroll container |
| Attribute | `selectable` | `single` \| `multiple`: every body row draws a checkbox cell; `multiple` adds select-all to the header row |
| Attribute | `label-select-row` | Name of a row's checkbox; `Select row` |
| Attribute | `label-select-all` | Name of the header checkbox; `Select all rows` |
| Property | `rows` | Read-only; the body rows |
| Property | `selectedValues` | Read-only; `value` of every selected row |
| Method | `refresh()` | Re-reads the rows; sections and rows call it, an app has no need to |
| Event | `punica-select` | `{ value, item }`: the selected rows' values and the row toggled (`null` for select-all) |
| Slot | default | `punica-table-header`, `punica-table-body`, `punica-table-footer` |
| Slot | `empty` | Shown while the body has no row |
| Part | `caption`, `empty` | |
| Custom property | `--punica-table-cell-padding`, `-border-color`, `-header-background`, `-header-color`, `-stripe-background`, `-selected-background`, `-font-size` | Set on the table; the cells read them |

Not supported: column or row spans (CSS table layout has none for custom
elements).

## `punica-table-header`, `punica-table-body`, `punica-table-footer`

Row groups (`role="rowgroup"`). No attributes, events, parts or custom
properties; the default slot takes `punica-table-row` elements.

## `punica-table-row`

| | Name | Notes |
|---|---|---|
| Attribute | `value` | What the row contributes to the table's selection |
| Attribute | `selected` | Boolean |
| Attribute | `label` | Name of this row's checkbox; the table's `label-select-row` otherwise |
| Slot | default | Cells |
| Part | `select-cell`, `checkbox` | The cell and native checkbox the row draws in a selectable table |
| State | `header` | The row is in a `punica-table-header` |

Setting `selected` from code fires nothing; the header checkbox follows.

## `punica-table-header-cell`

| | Name | Notes |
|---|---|---|
| Attribute | `sortable` | Boolean; the content becomes a native button |
| Attribute | `sort` | `ascending` \| `descending` \| `none`; reflected to `aria-sort` on a sortable header |
| Attribute | `column` | Key sent with `punica-sort`; the header's position in its row otherwise |
| Attribute | `align` | `start` \| `center` \| `end` |
| Event | `punica-sort` | `{ column, direction }`, cancelable. Unprevented, `sort` takes the direction here and is cleared on the row's other headers; the app reorders the rows |
| Slot | default | The header text |
| Part | `button`, `sort-icon` | |

## `punica-table-cell`

| | Name | Notes |
|---|---|---|
| Attribute | `align` | `start` \| `center` \| `end` |
| Slot | default | The content |

## `punica-code`

Inline code: a native `<code>` around the default slot.

| | Name | Notes |
|---|---|---|
| Slot | default | The code |
| Part | `base` | The `<code>` |
| Custom property | `--punica-code-background`, `-color`, `-radius`, `-padding`, `-font-size` | |

## `punica-code-block`

`<pre><code>` with a copy button. The code is the element's text content
(first line break, trailing space and shared indentation removed) or the
`code` property, and is always written with `textContent`.

| | Name | Notes |
|---|---|---|
| Attribute | `language` | Shown as a label and passed to `highlight` |
| Attribute | `label` | Accessible name of the code region |
| Attribute | `line-numbers` | Boolean |
| Attribute | `wrap` | Boolean; wrap long lines instead of scrolling |
| Attribute | `max-lines` | Number; show this many lines and an expand button |
| Attribute | `open` | Boolean; every line shows although `max-lines` is set |
| Attribute | `label-copy` | Name of the copy button; `Copy` |
| Attribute | `label-copied` | Announced in a polite live region after a copy; `Copied` |
| Attribute | `label-expand`, `label-collapse` | Text of the expand button; `Show more`, `Show less` |
| Property | `code` | String or null; wins over the text content |
| Property | `highlight` | `(text, language) => DocumentFragment \| null`; the block draws the fragment line by line, or plain text for null. No highlighter ships with the library |
| Property | `text` | Read-only; the code as shown and copied |
| Method | `copy()` | Copies with `navigator.clipboard`; resolves `true` when the clipboard took it |
| Event | `punica-toggle` | `{ open }`, when the user expands or cuts the block |
| Part | `base`, `header`, `language`, `copy-button`, `pre`, `code`, `line`, `expand-button`, `status` | |
| Custom property | `--punica-code-block-background`, `-color`, `-radius`, `-padding`, `-font-size`, `-line-number-color` | |
| State | `copied` | For two seconds after a copy |

## `punica-timestamp`

A native `<time datetime>` written through `Intl`.

| | Name | Notes |
|---|---|---|
| Attribute | `value` | ISO 8601 string or epoch milliseconds (the property also takes a number) |
| Attribute | `format` | `relative` \| `date` \| `time` \| `datetime`; `datetime` by default |
| Attribute | `date-style`, `time-style` | `Intl.DateTimeFormat` styles; `medium` and `short` |
| Attribute | `locale` | The nearest `lang`, then `navigator.language`, otherwise |
| Property | `date` | Read-only `Date`, or null while `value` names none |
| Part | `base` | The `<time>`; its `title` is the full date and time |
| Custom property | `--punica-timestamp-color` | |

`relative` uses `Intl.RelativeTimeFormat` and one timer armed for the moment
the wording next changes; the timer is cleared on disconnect and armed again
on connect.

## `punica-timer`

A countdown or a stopwatch on `performance.now()`. `role="timer"` with
`aria-live="off"`; a separate polite live region speaks at `announce-every`.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Accessible name |
| Attribute | `mode` | `countdown` \| `stopwatch`; `countdown` by default |
| Attribute | `duration` | Seconds a countdown starts from |
| Attribute | `until` | ISO 8601 moment a countdown ends at; wins over `duration` |
| Attribute | `running` | Boolean |
| Attribute | `format` | `Intl.DurationFormat` style: `digital` \| `long` \| `short` \| `narrow`; zero-padded `mm:ss` / `h:mm:ss` where the browser has no `Intl.DurationFormat` |
| Attribute | `announce-every` | Seconds between announcements; none by default |
| Attribute | `locale` | As on `punica-timestamp` |
| Property | `elapsed` | Read-only; milliseconds counted |
| Property | `remaining` | Read-only; milliseconds left, null for a stopwatch |
| Method | `start()` | Starts or resumes; a finished countdown starts over |
| Method | `pause()` | Stops where it is |
| Method | `reset()` | Back to the beginning; a running clock keeps running |
| Event | `punica-complete` | `{}`, once, when a countdown reaches zero; `running` turns false |
| Part | `base`, `status` | The `<time>` with the written duration; the live region |
| Custom property | `--punica-timer-color`, `--punica-timer-font-family` | |
| State | `running`, `complete` | |

With `until`, a pause freezes the display only: the end moment does not
move. No timer is held while the element is out of the document, and the
display catches up on reconnect.

## `punica-table-selection-toolbar`

The actions for the selected rows of a `punica-table` (or a
`punica-virtual-table`): the count, a clear button and the author's action
buttons. In `table/`. Hidden, and out of the tab order, while nothing is
selected; `role="toolbar"` with one tab stop otherwise.

| | Name | Notes |
|---|---|---|
| Attribute | `for` | Id of the table in the same document or shadow root; the enclosing table by default |
| Attribute | `label` | Accessible name of the toolbar; `Bulk actions` |
| Attribute | `label-selected` | Count text, `{count}` replaced by the number formatted with `Intl` in the element's language; `{count} selected` |
| Attribute | `label-clear` | Text of the clear button; `Clear selection` |
| Property | `count` | Read-only; number of selected rows |
| Property | `table` | Read-only; the table it reads, or null |
| Slot | default | Action controls |
| Part | `base`, `count`, `actions`, `clear-button` | The bar, the count text, the slot wrapper, the native clear button |
| Custom property | `--punica-table-selection-toolbar-background`, `-color`, `-radius`, `-padding`, `-gap` | |
| State | `empty` | Nothing selected; the bar is not drawn |
| Keyboard | Arrow Left / Right, Home, End | Move between the actions and the clear button; mirrored right-to-left |

The clear button makes the table fire its own `punica-select` (`{ value: [],
item: null }` on `punica-table`, `{ value: null, item: null }` on
`punica-virtual-table`), as a person's change; the toolbar fires nothing of
its own. A count change is spoken through a polite status region that is
never hidden, so the first selection is heard. After a clear, focus moves to
the table's select-all checkbox, or its first row checkbox.

Added to the tables for it:

| Element | | Name | Notes |
|---|---|---|---|
| `punica-table` | Method | `clearSelection()` | Clears every row; fires nothing |
| `punica-table` | Slot | `toolbar` | Drawn above the rows across the table's width (a table caption) |
| `punica-table` | Part | `toolbar` | Wrapper of the `toolbar` slot |
| `punica-virtual-table` | Property | `selectedValues` | Read-only; `[value]` or `[]`. The virtual table selects one row at most, so its toolbar counts 0 or 1 |
| `punica-virtual-table` | Method | `clearSelection()` | Sets `value` to null; fires nothing |

## `punica-chat-dictation-button`

A microphone toggle for `punica-chat-composer` over the Web Speech API
(`SpeechRecognition` / `webkitSpeechRecognition`). In `chat/`.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Accessible name while idle; `Start dictation` |
| Attribute | `label-stop` | Accessible name while listening; `Stop dictation` |
| Attribute | `locale` | Language recognised; the closest `lang`, then `navigator.language` |
| Attribute | `disabled` | Boolean; also disabled while its composer is |
| Property | `listening`, `supported` | Read-only booleans |
| Method | `start()`, `stop()` | `stop()` lets a phrase being heard settle first |
| Event | `punica-input` | `{ value, final: false }`, words not settled yet; cancelable |
| Event | `punica-change` | `{ value, final: true }`, a settled phrase; cancelable |
| Event | `punica-error` | `{ error }`: `not-allowed`, `no-speech`, `audio-capture`, `network`, `service-not-allowed`, `language-not-supported`, `start-failed` |
| Part | `base`, `icon`, `indicator` | The native button (`aria-pressed`), the microphone glyph, the pulsing ring |
| Custom property | `--punica-chat-dictation-button-size`, `-color`, `-active-color`, `-active-background` | |
| State | `listening` | Recognition is running |
| State | `unsupported` | No recognition in this browser; the host is `display: none` |

It stops on a second press, Escape anywhere, the window losing focus or the
page being hidden, an error, and disconnect (the recognition is aborted).
In the composer's `start` or `end` slot, unless the event is prevented, the
words go into the composer through its new method:

| Element | | Name | Notes |
|---|---|---|---|
| `punica-chat-composer` | Method | `insertText(text, { provisional })` | Inserts at the caret in place of the selection, spaced from neighbouring words, and fires the composer's `punica-input`; provisional text is replaced by the next insertion and forgotten once the person types |

A listener for `punica-input` on the composer hears both the button's event
(the words) and the composer's (the whole text), in that order: check
`event.target`.

## `punica-app-shell`

The frame of an app's page: header, side navigation, main content, a
secondary panel and a footer, as a CSS grid with named areas. In
`appShell/`.

The breakpoint is an attribute, not a custom property, because a custom
property cannot be read in a container query: `collapse-below` names one of
the library's widths (600, 900, 1200 px) and the shell compares its own
inline size, measured with a `ResizeObserver`, so a shell in a pane
collapses with the pane. Collapsed, the `nav` slot is moved into a
`punica-mobile-nav` in the shell's shadow root (one slot, never two copies
of the navigation), a menu button appears at the start of the header and
the `aside` region goes under the main content.

| | Name | Notes |
|---|---|---|
| Attribute | `fixed` | Boolean; the shell is `--punica-app-shell-height` tall and each region scrolls on its own; collapsed, everything under the header scrolls as one |
| Attribute | `collapse-below` | `small` \| `medium` \| `large` \| `none`: 600, 900, 1200 px, or never; `medium` |
| Attribute | `embedded` | Boolean; the shell is part of a page with its own `<main>`, so the content area is a `<div>`, not a second main landmark |
| Attribute | `nav-open` | Boolean; the navigation drawer is showing. Only while collapsed: it is cleared when the shell grows past the breakpoint |
| Attribute | `label-menu` | Name of the menu button; `Menu` |
| Attribute | `label-nav` | Name of the drawer; `Navigation` |
| Attribute | `label-skip` | Text of the skip button; `Skip to content` |
| Attribute | `label-close` | Name of the drawer's close button; `Close` |
| Property | `collapsed` | Read-only boolean |
| Event | `punica-open` | The drawer opened |
| Event | `punica-close` | `{ reason, returnValue }`: `escape`, `backdrop`, `close-button`, `navigate`, `resize` or `api` |
| Slot | default | The main content, in a native `<main>` |
| Slot | `header`, `nav`, `aside`, `footer` | |
| Part | `base`, `skip-link`, `header`, `menu-button`, `nav`, `main`, `aside`, `footer`, `drawer` | |
| Custom property | `--punica-app-shell-height` | Block size while `fixed`; `100dvh` |
| Custom property | `--punica-app-shell-nav-width`, `-aside-width`, `-background`, `-padding` | |
| State | `collapsed`, `has-nav` | |

Not fixed, the header sticks to the top of the scroll container and the
navigation and panel stick under it; the header's height is measured for
that, and `<main>` gets the same scroll margin. A visually hidden "skip to
content" button is the first tab stop and moves focus to `<main>`.

## `punica-mobile-nav`

The navigation of an app on a narrow screen: a native `<dialog>` opened with
`showModal()`, sliding from the inline-start edge, built on the same
`ModalSurface` as `punica-dialog` and `punica-drawer` (focus kept inside,
Escape, scroll lock, focus back to the opener). In `mobileNav/`.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Name of the dialog; `Navigation` |
| Attribute | `open` | Boolean |
| Attribute | `side` | `inline-start` \| `inline-end`; `inline-start` |
| Attribute | `no-light-dismiss`, `no-close-button` | Booleans |
| Attribute | `keep-open` | Boolean; activating a link inside does not close it |
| Attribute | `label-close` | Name of the close button; `Close` |
| Property | `returnValue` | Read-only |
| Method | `show()`, `hide(returnValue)`, `requestClose(reason, returnValue)` | |
| Event | `punica-open` | |
| Event | `punica-request-close` | `{ reason }`, cancelable |
| Event | `punica-close` | `{ reason, returnValue }`: `escape`, `backdrop`, `close-button`, `navigate` or `api` |
| Slot | default | The navigation |
| Slot | `header` | Beside the close button |
| Slot | `trigger` | The button that opens it; given `aria-haspopup="dialog"` and `aria-expanded` |
| Part | `dialog`, `header`, `body`, `close-button` | |
| Custom property | `--punica-mobile-nav-width` | `320px`, capped at 85vw |
| Custom property | `--punica-mobile-nav-padding`, `-background`, `-backdrop`, `-shadow` | |

A click on any `<a href>` inside, through shadow roots (a
`punica-side-nav-item` with `href` counts), asks to close with reason
`navigate`, so a single-page app is left with the new view.

## `punica-section`

A titled region of a page. A native `<section>` in the shadow root,
`aria-labelledby` its heading in the same root, so it is a `region`
landmark with the heading's name; the description slot is its
`aria-describedby`. In `section/`.

| | Name | Notes |
|---|---|---|
| Attribute | `heading` | The heading text; the `heading` slot wins |
| Attribute | `level` | 1–6, a real `<h1>`–`<h6>`; `2`, and anything else is 2 |
| Attribute | `label` | Name of the region when it should differ from the heading |
| Attribute | `divider` | Boolean; a line under the header row |
| Attribute | `collapsible` | Boolean; the heading holds a disclosure button (`aria-expanded`, `aria-controls`) |
| Attribute | `open` | Boolean; the body is showing. Read only while `collapsible`, so a collapsible section starts closed unless `open` is set |
| Method | `show()`, `hide()`, `toggle()` | Fire nothing |
| Event | `punica-toggle` | `{ open }`, when the user flips a collapsible section |
| Slot | default | The body |
| Slot | `heading`, `description`, `actions` | The actions sit at the end of the header row |
| Part | `base`, `header`, `heading`, `toggle`, `chevron`, `description`, `actions`, `body` | |
| Custom property | `--punica-section-gap`, `-padding`, `-heading-size`, `-divider-color` | |
| State | `open` | A collapsible section's body is showing |

## `punica-outline`

"On this page": a native `<nav>` of links to the headings inside a target,
nested by level. In `outline/`.

| | Name | Notes |
|---|---|---|
| Attribute | `for` | Id of the target, in the same tree |
| Attribute | `levels` | Heading tags, separated by spaces or commas; `h2 h3`. Anything that is not `h1`–`h6` is dropped |
| Attribute | `label` | Name of the landmark; `On this page` |
| Property | `target` | The target element; wins over `for` |
| Property | `active`, `headings` | Read-only: the id of the heading being read, the headings listed |
| Method | `refresh()` | Reads the headings again |
| Event | `punica-select` | `{ value, item }`: the heading's id and the heading, when a link is activated. Cancelable: preventing it stops the move |
| Part | `base`, `list`, `item`, `link`, `current` | |
| Custom property | `--punica-outline-indent`, `-track-color`, `-active-color` | |
| Custom property | `--punica-outline-offset` | Height of a fixed header over the content |
| State | `empty` | |

A heading with no id is given one from its text, made unique in its tree.
The section being read (`aria-current="location"`) comes from an
`IntersectionObserver` rooted at the scroll container the target is in
(found through slots and shadow roots): the first heading in the top 45% of
it, or else the last one scrolled past. A `MutationObserver` on the target
rebuilds the list in the next frame when headings change. Both observers are
disconnected while the element is out of the document. A heading in the
document is reached by the link itself; one inside a shadow root, which a
fragment cannot reach, is scrolled into view.

## `punica-alert-dialog`

A confirmation before a destructive or irreversible action. In
`alertDialog/`, built on the dialog's `ModalSurface` and its stylesheet.

| | Name | Notes |
|---|---|---|
| Attribute | `heading` | The question; a level-2 heading that names the dialog |
| Attribute | `label` | Accessible name in place of `heading` |
| Attribute | `open` | Boolean |
| Attribute | `confirm-label`, `cancel-label` | Button text; `Confirm`, `Cancel` |
| Attribute | `color` | Of the confirm button; `error` for a destructive action |
| Attribute | `loading` | Boolean; the confirm button shows a spinner and ignores clicks |
| Property | `returnValue` | Read-only: `confirm`, `cancel` or empty |
| Method | `ask()` | Opens it; resolves `true` on confirm, `false` on any other close |
| Method | `show()`, `hide(value)`, `requestClose(reason, value)` | From `ModalSurface` |
| Function | `confirm({ heading, message, confirmLabel, cancelLabel, color, container })` | Module export: makes one in `<body>` (or `container`), asks, removes it; resolves like `ask()` |
| Event | `punica-open` | |
| Event | `punica-request-close` | `{ reason }`, cancelable: preventing a `confirm` keeps it open while the work runs |
| Event | `punica-close` | `{ reason, returnValue }`; `reason` is `confirm`, `cancel`, `escape` or `api` |
| Slot | default | The description; the dialog's `aria-describedby` |
| Part | `dialog`, `panel`, `heading`, `description`, `actions`, `cancel-button`, `confirm-button` | |
| Custom property | `--punica-alert-dialog-width` | `400px`; the `--punica-dialog-*` properties also apply |

`role=alertdialog` on a native modal `<dialog>`. Focus goes to the cancel
button. Escape cancels (`reason: 'escape'`); the backdrop does nothing. Under
600 px of viewport the buttons stack full width, confirm above cancel.

## `punica-info-tip`

A small "i" button that shows a short explanation (a toggletip). In
`infoTip/`.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Name of the button; `More information` |
| Attribute | `open` | Boolean |
| Attribute | `side`, `align` | `block-start`, `center` by default |
| Attribute | `size` | `small` 14 px, `medium` 16 px, `large` 20 px icon; the target is at least 24 px |
| Attribute | `delay` | Hover preview delay, 300 ms |
| Method | `show()`, `hide(reason)`, `focus()` | |
| Event | `punica-open`, `punica-close` | close: `{ reason }`: `button`, `escape`, `outside`, `blur`, `pointer`, `api` |
| Slot | default | The explanation |
| Part | `button`, `icon`, `panel` | |
| Custom property | `--punica-info-tip-color`, `-size`, `-radius`, `-padding`, `-background`, `-shadow`, `-max-width` | |
| State | `pinned` | Opened by a press |

Click, tap, Enter or Space pins it (`aria-expanded="true"`); hovering
previews it. The explanation is the button's accessible description at all
times.

## `punica-avatar-group`

Overlapping `punica-avatar` children. In `avatarGroup/`.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Name of the group (`role=group`) |
| Attribute | `max` | Most avatars shown; the rest collapse into "+N" |
| Attribute | `overflow` | `list` (default: "+N" is a button opening a popover of the hidden names) or `count` (plain text, `role=img`) |
| Attribute | `size` | `small`, `medium`, `large`; wins over each avatar's own size |
| Attribute | `label-overflow` | Name of "+N"; `{count} more` |
| Property | `hiddenAvatars` | Read-only: the collapsed avatars |
| Event | `punica-open`, `punica-close` | The list of hidden names; close `{ reason }` |
| Slot | default | `punica-avatar` elements |
| Part | `base`, `overflow`, `panel`, `list`, `item` | |
| Custom property | `--punica-avatar-group-size`, `-overlap`, `-ring-width`, `-ring-color` | |
| State | `overflowing` | |

Manual slot assignment: hidden avatars stay in the light DOM, untouched, and
are not rendered. A `MutationObserver` (disconnected on disconnect) follows
children and their names.

## `punica-blockquote`

A quotation: native `<blockquote>` in a `<figure>`. In `blockquote/`.

| | Name | Notes |
|---|---|---|
| Attribute | `cite` | Address of the source; the blockquote's `cite` |
| Attribute | `variant` | `default`, `emphasis` (larger, accent rule) |
| Slot | default | The quotation |
| Slot | `attribution` | In a `<figcaption>`, hidden while empty |
| Part | `base`, `quote`, `attribution` | |
| Custom property | `--punica-blockquote-rule-width`, `-rule-color`, `-padding`, `-color`, `-font-size` | |
| State | `attributed` | |

## `punica-metadata-list`, `punica-metadata-list-item`

Label and value pairs. In `metadataList/`.

| | Name | Notes |
|---|---|---|
| Attribute (list) | `label` | Name of the list |
| Attribute (list) | `layout` | `inline` (default), `stacked`, `columns` |
| Attribute (list) | `columns` | 1–12, `2`; one column under 480 px of the list's width |
| Attribute (list) | `dividers`, `dense` | Booleans |
| Part (list) | `base` | |
| Custom property (list) | `--punica-metadata-list-gap`, `-label-width`, `-label-color`, `-divider-color` | |
| Attribute (item) | `label` | The key; or the `label` slot |
| Attribute (item) | `copyable` | Boolean; a copy button beside the value |
| Attribute (item) | `copy-value` | Text copied in place of the value's text |
| Attribute (item) | `label-copy`, `label-copied` | `Copy`, `Copied` |
| Method (item) | `copy()` | Resolves whether the clipboard took it |
| Slot (item) | default, `label` | |
| Part (item) | `label`, `value`, `copy-button`, `status` | |
| State (item) | `copied` | Two seconds |

Semantics: the list is `role=list` and each item `role=listitem` (through
`ElementInternals`); inside each item the label is `role=term` and the value
`role=definition`. That is the tree Chromium builds for a native `<dl>`,
plus the list item level ARIA requires. A native `<dl>` cannot be used: the
list's shadow root cannot slot an item's children into its `<dt>`/`<dd>`. The
copy button is named by `label-copy` and described by the item's label. The
`inline` layout aligns every label in one column through `subgrid`.

## `punica-thumbnail`

A fixed-ratio image preview. In `thumbnail/`.

| | Name | Notes |
|---|---|---|
| Attribute | `src`, `srcset`, `sizes` | As on `<img>` |
| Attribute | `alt` | Text alternative; empty or missing is decorative |
| Attribute | `ratio` | `4/3` or one number; `1/1` for anything else |
| Attribute | `fit` | `cover` (default), `contain` |
| Attribute | `size` | `small` 48, `medium` 96 (default), `large` 160 px |
| Attribute | `radius` | `none`, `small`, `medium` (default), `large`, `full` |
| Attribute | `loading` | `lazy` (default), `eager` |
| Attribute | `href`, `target` | Makes it a link |
| Attribute | `label` | Name of the link when `alt` does not name it |
| Event | `punica-load`, `punica-error` | `{ src }` |
| Slot | `fallback` | In place of the placeholder glyph |
| Part | `base`, `image`, `skeleton`, `fallback` | |
| Custom property | `--punica-thumbnail-size`, `-radius`, `-background` | |
| State | `loading`, `loaded`, `error` | `error` also with no `src` |

While loading, a `punica-skeleton` shimmers; on error or with no picture the
fallback shows and carries `alt` as `role=img`.

## `punica-checkbox-group`

A set of `punica-checkbox`es under one name; the group is the form control.
In `checkboxGroup/`.

| | Name | Notes |
|---|---|---|
| Attribute | `value` | Default value: the ticked values, space-separated. Without it, the boxes ticked in the markup |
| Property | `value` | `string[]`, the ticked values in document order |
| Attribute | `name` | One FormData entry per ticked value |
| Attribute | `label` | Accessible name (`role=group`) and the visible legend |
| Attribute | `label-hidden` | Boolean; no legend drawn. Implied inside a `punica-field` |
| Attribute | `orientation` | `vertical` (default), `horizontal` |
| Attribute | `disabled`, `required` | `required`: at least one ticked; the browser's message |
| Attribute | `min`, `max` | Ticked count limits (`rangeUnderflow` / `rangeOverflow`); `min` applies once any is ticked |
| Attribute | `label-too-few`, `label-too-many` | `Choose at least {min}.`, `Choose no more than {max}.` |
| Event | `punica-change` | `{ value }`; the box's own event stops at the group |
| Slot | default, `label` | |
| Part | `label`, `items` | |
| Custom property | `--punica-checkbox-group-gap`, `-label-color` | |
| State | `valid`, `invalid`, `disabled` | |

The boxes carry no `name`: the group owns it, and a box with its own name
would submit itself as well. `disabled` on the group disables the boxes it
finds enabled and gives back exactly those when it is enabled again.

## `punica-input-group`, `punica-input-group-text`

A control and its addons in one box. Layout only: it submits nothing and
never writes an attribute on a child. In `inputGroup/`.

| | Name | Notes |
|---|---|---|
| Attribute | `size` | `small`, `medium`, `large`; given to the children through their `--punica-*-height` / `-radius` custom properties. Without it each child keeps its own |
| Attribute | `label` | Makes it a `group` named by it |
| Attribute | `disabled` | Dims it and makes the row `inert`; the controls still submit |
| Attribute | `full-width` | |
| Slot | default | `punica-input`, `-select`, `-number-input`, `-autocomplete`, `-tokenizer`, date and time pickers, `punica-button`, `punica-icon-button`, `punica-input-group-text` |
| Part | `base` | The row; the focus ring is drawn on it |
| Custom property | `--punica-input-group-radius` | Outer corners |
| State | `focus-visible`, `focus-within` | |
| Text: slot / part | default / `base` | |
| Text: custom property | `--punica-input-group-text-height`, `-padding`, `-radius`, `-background`, `-color` | |

Only the outer corners round, mirrored right-to-left; the borders overlap by
one width. One ring goes around the group while any part has keyboard focus
(the fields' own rings are switched off; a focused button keeps an inset
ring). The addon text keeps its own character order (`unicode-bidi:
plaintext`).

## `punica-form-layout`

Lays out the fields of a form. Layout only. In `formLayout/`.

| | Name | Notes |
|---|---|---|
| Attribute | `columns` | 1 to 4, `1` by default |
| Attribute | `label-position` | `top` (default), `start`: labels beside the fields in one aligned column (`subgrid`) |
| Attribute | `gap` | `small`, `medium` (default), `large`: row gap |
| Child attribute | `span` | `2`, `3`, `4`, `full`; capped at the column count |
| Slot | default, `actions` | `actions` lines up with the fields |
| Part | `base`, `actions` | |
| Custom property | `--punica-form-layout-gap`, `-column-gap`, `-label-max-width` | |
| State | `has-actions` | |

In a container narrower than 480 px it is one column with labels above (a
container query on itself). With `label-position="start"`, a `punica-field`'s help
and error text need `punica-field` to place them in its last grid column;
until it does they fall under the label.

## `punica-selectable-card`, `punica-selectable-card-group`

A card that is a choice. In `selectableCard/`.

| | Name | Notes |
|---|---|---|
| Attribute | `type` | `checkbox` outside a group, `radio` inside, by default |
| Attribute | `value`, `checked`, `name` | A checkbox card submits `value` (`on`) while checked |
| Attribute | `label` | Name in place of the title |
| Attribute | `disabled`, `required` | |
| Event | `punica-change` | Checkbox card: `{ checked, value }` |
| Slot | default, `media`, `title`, `description` | Title names the card, description describes it |
| Part | `base`, `media`, `title`, `description`, `indicator` | |
| Custom property | `--punica-selectable-card-padding`, `-radius`, `-background`, `-border-color`, `-checked-color`, `-checked-background` | |
| State | `checked`, `radio`, `disabled`, `valid`, `invalid` | |
| Group | everything `punica-radio-group` has | It extends it; `orientation` is `horizontal` (a wrapping grid) by default |
| Group custom property | `--punica-selectable-card-group-gap`, `-min-width` | |

Role `checkbox` or `radio` through `ElementInternals`; Space and Enter
toggle a checkbox card, the group's arrows, Home and End move and choose.
A click on a link or button inside a checkbox card is its own.

## `punica-complex-selector`, `punica-complex-option`, `punica-option-group`

A select for rich choices: a trigger, and a panel with a search combobox
over grouped rows. In `complexSelector/`.

| | Name | Notes |
|---|---|---|
| Attribute | `value`, `multiple`, `name`, `placeholder`, `clearable`, `label`, `open`, `size`, `full-width`, `disabled`, `required` | As on `punica-select` |
| Attribute | `label-search`, `label-no-results`, `label-select-all`, `label-clear` | `Search`, `No results`, `Select all`, `Clear` |
| Property | `value`, `options`, `selectedOptions` | |
| Method | `show()`, `hide()`, `focus()` | |
| Event | `punica-change` `{ value }`, `punica-open`, `punica-close` `{ reason }` | |
| Slot | default, `start` | Rows and groups; an icon |
| Part | `field`, `trigger`, `value`, `chip`, `clear`, `caret`, `panel`, `search`, `listbox`, `group-header`, `empty` | |
| Custom property | `--punica-complex-selector-radius`, `-height`, `-padding`, `-border-color`, `-background`, `-min-width`, `-panel-width`, `-listbox-max-height`, `-chip-background` | |
| State | `open`, `placeholder`, `disabled`, `user-invalid` | |
| Option | `punica-complex-option` | A `punica-option` with `description` (attribute or slot) and a `start` slot for an icon or avatar; the search matches both lines |
| Group | `punica-option-group` | `label`; a `group` named by it |

The trigger is a `combobox` with `aria-haspopup=dialog`; the panel is a
`dialog` whose search field is a `combobox` over the `listbox`, keeping
focus while the arrows move (`aria-activedescendant`). The shadow root
uses manual slot assignment so each group's heading, which with `multiple`
is the row that selects the group's rows the search leaves showing, lives
beside the group in the selector's own tree.

## `punica-power-search`

A search field that builds structured filters. In `powerSearch/`.

| | Name | Notes |
|---|---|---|
| Property | `filters` | `[{ key, label, type: 'text' \| 'select' \| 'date', options?, operators? }]` |
| Property | `value` | `{ query, filters: [{ key, operator, value }] }` |
| Attribute | `value` | Default, as that JSON |
| Attribute | `name` | Submitted as one JSON string |
| Attribute | `label`, `placeholder`, `open`, `disabled`, `readonly`, `required`, `size`, `full-width` | `required`: a query or a filter |
| Attribute | `label-value`, `label-remove` | `Value`, `Remove` |
| Event | `punica-input` | `{ value }` while the query is typed |
| Event | `punica-change` | `{ value }` a filter added or removed, the query committed |
| Event | `punica-search` | `{ value }` on Enter; cancelable, and cancelled it does not submit the form |
| Event | `punica-open`, `punica-close` | |
| Slot | `start` | In place of the search glyph |
| Part | `field`, `icon`, `tokens`, `token`, `token-label`, `remove`, `pending`, `input`, `date`, `listbox`, `option` | |
| Custom property | `--punica-power-search-radius`, `-height`, `-padding`, `-border-color`, `-background`, `-min-width`, `-token-background`, `-listbox-max-height` | |
| State | `open`, `pending`, `disabled`, `user-invalid` | |

Default operators: `contains` (text), `is` (select), `on` (date); a field
with several `operators` asks for one before the value. A token reads
`Status: Open`, or `Owner is not dana` with another operator. A date value
is `YYYY-MM-DD`, shown through `Intl` in the element's language. A typed
or dated value is kept when focus leaves; a half-built filter is not.
