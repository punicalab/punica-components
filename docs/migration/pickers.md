# Migrating select and the pickers from 1.x to 2.0

Nine elements: three rewritten (`punica-select`, `punica-date-picker`,
`punica-time-picker`), one renamed (`punica-select-item` → `punica-option`)
and five new. Every one that takes a value is a real form control now: it
has `name`, `disabled`, `required`, takes part in `FormData`, `form.reset()`,
`<fieldset disabled>` and constraint validation, and is named by `label` or
by a `<label for>`.

Shared across the package:

- Events are `punica-*` and carry `detail`. A value set from code fires nothing.
- `size` is `small | medium | large` (28 / 36 / 44 px from the tokens; 1.x was 32 / 40 / 48).
- `full-width` replaces `fullwidth`.
- A floating list or calendar is a `popover="manual"` panel in the element's own shadow root, in the top layer. Nothing is appended to `document.body` and no z-index token is read.
- Custom states: `:state(open)`, `:state(disabled)`, `:state(user-invalid)` (invalid after the user touched the field), plus `:state(valid)` / `:state(invalid)` from the form mixin.
- 1.x tokens map as in [`MIGRATION-2.0.md`](../MIGRATION-2.0.md#tokens).

## `punica-select`

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-select` | `punica-select` |
| Options | `punica-select-item` children, registered by calling `parent.itemAdd()` | `punica-option` children, read from the default slot |
| `value` attribute | the current value, rewritten on every pick | the **default** value; space-separated with `multiple`; an option with `selected` in the markup is a default too |
| `value` property | string, mirrors the attribute | current value: `string \| null`, or `string[]` with `multiple` |
| `multiple` | none | new |
| `placeholder` | `placeholder` | `placeholder` |
| `clearbutton` / `clear-button` + `clear` slot | consumer supplied the button | `clearable`; the button is built in and named by `label-clear` (default `Clear`) |
| `label` | none (no accessible name) | `label`, or a `<label for>` |
| `open` | none; `show()` / `hide()` methods | `open` attribute and property; `show()` / `hide()` kept |
| `disabled` | attribute, `pointer-events: none` | real: native button disabled, left out of `FormData`, follows `<fieldset disabled>` |
| `name`, `required` | none | new |
| `size` | `small \| medium \| large` | same names, token heights |
| `fullwidth` | `fullwidth` | `full-width` |
| `error` | `error` attribute coloured the border | removed: use `required` / `setCustomValidity()`; style `:state(user-invalid)` |
| `rounded` | attribute turned the radius on | removed: always rounded; set `--punica-select-radius: 0` for square |
| `loading` + `preload` slot | consumer supplied a spinner | removed |
| `adornment` attribute, `adornment` slot | leading content | slot `start` |
| `caret` slot | consumer supplied the chevron | removed: built in, `part="caret"` |
| `minimumtargetwidth` | list at least as wide as the field | removed: always so |
| `selecteditemdisplayitem` | selector of a node inside the item whose `innerHTML` was copied into the field | removed: the field shows the option's `label`, or its text, by `textContent` |
| Event: change | `change` `{ value }` | `punica-change` `{ value }` (string, array, or null after a clear) |
| Event: open | none | `punica-open` |
| Event: close | `close`, no detail | `punica-close` `{ reason }`: `select \| escape \| outside \| blur \| api` |
| Keyboard | Escape only | APG select-only combobox: Enter / Space / ArrowDown / ArrowUp open, arrows, Home, End, PageUp, PageDown, type-ahead, Enter or Space selects, Alt+ArrowUp selects and closes, Escape closes, Tab selects and moves on |
| Roles | none | `button[role=combobox]` with `aria-expanded`, `aria-controls`, `aria-activedescendant` (element reflection); `role=listbox`; options `role=option` with `aria-selected` |
| Parts | none | `field`, `trigger`, `value`, `clear`, `caret`, `listbox` |
| CSS custom properties | `--select-border-radius`, `--select-border-color` | `--punica-select-radius`, `--punica-select-border-color`, plus `--punica-select-height`, `-padding`, `-background`, `-min-width`, `-listbox-max-height` |
| Getters | none | `options`, `selectedOptions` |

Removed outright: the `div#select` and `<style>` appended to `document.body`
under a global id (two open selects shared them), the copy of an option's
`innerHTML` into the shadow tree, the override of
`HTMLElement.prototype.click`, the transparent full-page backdrop,
`itemAdd()`, `setSelectedItemContent()`, `updateContent()`, `fireOnChange()`,
`fireOnClose()`.

## `punica-option` (was `punica-select-item`)

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-select-item` | `punica-option` |
| Used by | `punica-select` | `punica-select`, `punica-autocomplete`, `punica-tokenizer` |
| `value` | attribute and property | same; when absent the row's text is the value |
| `label` | none | new: text used for display and filtering; defaults to the text content |
| `selected` | set by the select | same; in markup it marks the default selection |
| `disabled` | none | new |
| `active` | none | property set by the parent for the keyboard-highlighted row; `:state(active)`, no attribute |
| Slots | default | default, `start`, `end` |
| Events | none; the select listened for `click` | none; the parent still listens for `click` |
| Roles | none | `role=option`, `aria-selected`, `aria-disabled` through ElementInternals |
| Parts | none | `label`, `check` |
| CSS custom properties | none | `--punica-option-padding`, `--punica-option-active-background`, `--punica-option-selected-background` |
| Getters | none | `text`, `optionValue` |
| Removed | calling `parentElement.itemAdd(this)` on connect | the row no longer knows its parent |

## `punica-date-picker`

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-date-picker` | `punica-date-picker` |
| `value` | getter only, read from the attribute; a Unix-seconds `data-date` inside | attribute is the default, property is the current value; ISO `yyyy-mm-dd` or null |
| `minDate` / `maxDate` | getters over `minDate` / `maxDate` attributes | `min` / `max`, ISO dates; also checked on typed input (`rangeUnderflow` / `rangeOverflow`) |
| `timezone` | attribute, with a `setHours(3)` workaround | removed: the value is a calendar date and never passes through local time |
| `locale` | none; English month and day names hard-coded | `locale`, else the nearest `lang`, else the browser's; names and order from `Intl` |
| `open` | attribute | attribute and property; `show()` / `hide()` |
| `placeholder`, `label`, `name`, `disabled`, `readonly`, `required`, `size`, `full-width` | none (placeholder was a fixed `Lorem Ipsum...`) | new |
| Typing | not parsed | parsed in the language's own day / month / year order, or as ISO; text that is not a date stays and sets `badInput` |
| `disabledDates` | none | function property `(iso) => boolean` |
| Button labels | none | `label-toggle` (default `Choose date`), `label-previous-month`, `label-next-month`, `label-previous-year`, `label-next-year` |
| Slots | `endAdornment` (the open button), `previous-month`, `next-month` | `start`; the three buttons are built in |
| Event: change | none | `punica-change` `{ value }` |
| Events: surface | none | `punica-open`, `punica-close` `{ reason }` |
| Keyboard | none | ArrowDown in the input opens the calendar; the calendar's own grid keys; Escape closes; Enter in the input commits and submits the form |
| Parts | none | `field`, `input`, `toggle`, `panel`, `calendar` |
| CSS custom properties | none | `--punica-date-picker-radius`, `-height`, `-padding`, `-border-color`, `-background`, `-min-width`, `-panel-padding` |
| Getters | none | `calendar` (the inner `punica-calendar`) |
| Removed | composing `punica-input` and `punica-paper`; the listener that was added in `disconnectedCallback`; the `handle*` methods | |

## `punica-time-picker`

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-time-picker` | `punica-time-picker` |
| Shape | AM / PM toggle with hour and minute steppers; opened itself on connect | a text input (a combobox) with a list of times |
| `value` | none | attribute is the default, property is the current value; 24-hour `HH:mm` or null |
| `step` | none (one minute per click) | minutes between listed times, default 30; any minute can still be typed |
| `min` / `max` | none | `HH:mm`; the list is cut to them and typed input is checked |
| 12 / 24 hour | always 12-hour with English AM / PM | from `locale` / `lang` through `Intl` |
| `open` | attribute | attribute and property; `show()` / `hide()` |
| `placeholder`, `label`, `name`, `disabled`, `readonly`, `required`, `size`, `full-width`, `locale` | none | new |
| Slots | `endAdornment`, `hour-up`, `hour-down`, `minutes-up`, `minutes-down` | `start` |
| Events | none | `punica-change` `{ value }`, `punica-open`, `punica-close` `{ reason }` |
| Keyboard | none | ArrowDown / ArrowUp open and move, PageUp / PageDown, Enter selects, Escape closes, Enter in the closed field submits the form |
| Parts | none | `field`, `input`, `toggle`, `listbox`, `option` |
| CSS custom properties | none | `--punica-time-picker-radius`, `-height`, `-padding`, `-border-color`, `-background`, `-min-width`, `-listbox-max-height` |
| Removed | `incrementHour()`, `decrementHour()`, `incrementMinutes()`, `decrementMinutes()`; composing `punica-input`, `punica-paper`, `punica-toggle-button-group`, `punica-typography` | |

## `punica-calendar` (new)

The month grid that was private to the 1.x date picker.

| | 1.x | 2.0 |
|---|---|---|
| Tag | none (markup inside `punica-date-picker`) | `punica-calendar` |
| Attributes | | `value`, `min`, `max`, `locale`, `first-day-of-week` (0 Sunday to 6 Saturday; from the locale by default), `range`, `value-start`, `value-end`, `disabled`, `label`, `label-previous-month`, `label-next-month`, `label-previous-year`, `label-next-year` |
| Properties | | the same, plus `disabledDates` (`(iso) => boolean`) and read-only `month` (`yyyy-mm`) |
| Methods | | `showDate(iso)`, `focus()` |
| Events | | `punica-change` `{ value }`; with `range`: `punica-input` `{ value, valueStart, valueEnd: null }` after the first pick and `punica-change` `{ value: 'start/end', valueStart, valueEnd }` after the second; `punica-select` `{ value, item }` on every activated day |
| Keyboard | click only | APG date grid: arrows by day and week, Home / End of the week, PageUp / PageDown month, Shift+PageUp / PageDown year, Enter / Space select; one day in the tab order |
| Roles | buttons in a `div` | `table[role=grid]`, `td[role=gridcell]` with `aria-selected`, `aria-disabled`, `aria-current="date"` and the full date as its name |
| Slots | `previous-month`, `next-month` on the date picker | none |
| Parts | | `header`, `title`, `nav`, `grid`, `weekday`, `day` (with `today`, `selected`, `outside`, `in-range`, `range-start`, `range-end`, `disabled`) |
| CSS custom properties | | `--punica-calendar-day-size`, `--punica-calendar-gap`, `--punica-calendar-accent`, `--punica-calendar-range-background` |

## `punica-date-range-input` (new)

| | 2.0 |
|---|---|
| Tag | `punica-date-range-input` |
| Attributes | `value-start`, `value-end` (defaults), `min`, `max`, `locale`, `label`, `label-start` (`Start date`), `label-end` (`End date`), `placeholder-start`, `placeholder-end`, `open`, `name`, `disabled`, `readonly`, `required`, `size`, `full-width`, `label-toggle` (`Choose dates`), the four calendar navigation labels |
| Properties | `valueStart`, `valueEnd` (current), read-only `value` (`start/end` or null), `disabledDates`, `calendar` |
| Form | two entries: `<name>-start` and `<name>-end`; `required` needs both; an end before the start is `rangeUnderflow` |
| Events | `punica-change` `{ value, valueStart, valueEnd }`; `punica-input` with `valueEnd: null` after the first pick on the calendar; `punica-open`; `punica-close` `{ reason }` |
| Slots | `start` |
| Parts | `field`, `input`, `start`, `end`, `separator`, `toggle`, `panel`, `calendar` |
| CSS custom properties | `--punica-date-range-input-radius`, `-height`, `-padding`, `-border-color`, `-background`, `-min-width`, `-panel-padding` |

## `punica-date-time-input` (new)

| | 2.0 |
|---|---|
| Tag | `punica-date-time-input` |
| Composition | a `punica-date-picker` and a `punica-time-picker` in its shadow root |
| Attributes | `value` (default, ISO local `yyyy-mm-ddTHH:mm`), `min`, `max` (date-times), `step`, `locale`, `label`, `label-date` (`Date`), `label-time` (`Time`), `placeholder-date`, `placeholder-time`, `name`, `disabled`, `readonly`, `required`, `size`, `full-width`, `label-toggle`, the four calendar navigation labels |
| Properties | `value` (current; null until both parts are filled) |
| Form | one entry; a filled date with an empty time, or the reverse, is `badInput` |
| Events | `punica-change` `{ value }`; `punica-open` / `punica-close` from whichever part opened |
| Slots | none |
| Parts | `group`, `date`, `time` |
| CSS custom properties | `--punica-date-time-input-gap`; the two parts take their own properties through `::part(date)` and `::part(time)` |

## `punica-autocomplete` (new)

| | 2.0 |
|---|---|
| Tag | `punica-autocomplete` |
| Attributes | `value` (default), `placeholder`, `label`, `open`, `free-text`, `no-filter`, `clearable`, `label-clear` (`Clear`), `name`, `disabled`, `readonly`, `required`, `size`, `full-width` |
| Properties | `value` (current: the picked option's value, or the typed text with `free-text`), `options` (array of strings or `{ value, label?, disabled? }`) |
| Options | `punica-option` children, the `options` array, or both. The element sets `hidden` on the rows the typed text does not match |
| Remote data | listen for `punica-input`, fetch, assign `options`; add `no-filter` when the server already filtered |
| Events | `punica-input` `{ value }` (the text), `punica-change` `{ value }`, `punica-open`, `punica-close` `{ reason }`: `select \| escape \| outside \| blur \| empty \| api` |
| Keyboard | APG editable combobox with list autocomplete: typing filters, ArrowDown / ArrowUp open and move through `aria-activedescendant`, PageUp / PageDown, Enter picks, Escape closes, Alt+ArrowUp closes, Enter with no row highlighted commits and submits the form |
| Slots | default (options), `start`, `end` |
| Parts | `field`, `input`, `clear`, `listbox`, `option` |
| CSS custom properties | `--punica-autocomplete-radius`, `-height`, `-padding`, `-border-color`, `-background`, `-min-width`, `-listbox-max-height` |

## `punica-tokenizer` (new)

| | 2.0 |
|---|---|
| Tag | `punica-tokenizer` |
| Attributes | `value` (default, a JSON array: `value='["a","b"]'`), `separator` (default `,`), `placeholder`, `label`, `label-remove` (`Remove`; the token's text follows it), `open`, `name`, `disabled`, `readonly`, `required`, `size`, `full-width` |
| Properties | `value` (current, `string[]`) |
| Form | one entry per value; `required` needs at least one |
| Adding | Enter, the separator, pasted or autofilled text split at the separator and at line breaks, a picked suggestion, text left in the input on blur. Trimmed; a duplicate is dropped |
| Removing | Backspace in the empty input removes the last token; Backspace or Delete on a focused token; the token's remove button |
| Keyboard | ArrowLeft at the start of the input goes to the last token; ArrowLeft / ArrowRight / Home walk the tokens, End returns to the input; with suggestions, ArrowDown / ArrowUp, Enter and Escape as in the autocomplete; Enter in the empty input submits the form |
| Suggestions | optional `punica-option` children; a taken one is hidden; the token shows the option's label and submits its value |
| Events | `punica-change` `{ value }`, `punica-input` `{ value }` (the text), `punica-open`, `punica-close` `{ reason }` |
| Slots | default (options), `start` |
| Parts | `field`, `tokens`, `token`, `token-label`, `remove`, `input`, `listbox` |
| CSS custom properties | `--punica-tokenizer-radius`, `-height`, `-padding`, `-border-color`, `-background`, `-min-width`, `-token-background`, `-token-radius`, `-listbox-max-height` |
