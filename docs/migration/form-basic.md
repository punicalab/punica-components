# Migrating the basic form controls from 1.x to 2.0

Seven elements were rewritten and seven are new. Tag names did not change;
attributes, events, slots and custom properties did. What holds for every
element below:

- **Events are `punica-*`.** Nothing fires a `CustomEvent` named `change`,
  `input`, `focus`, `blur` or `keydown` any more. Listen for `punica-input`
  and `punica-change`; the native `focus`, `blur`, `keydown` and `click`
  reach the host on their own. A change made from script fires nothing.
- **Booleans follow HTML.** `disabled="false"` is disabled. Remove the
  attribute, or set the property to `false`.
- **`null` removes.** `el.placeholder = null` removes the attribute; 1.x wrote
  the string `"null"`.
- **Every control is a real form control**: it is in `new FormData(form)`, is
  left out while disabled, goes back to its default on `form.reset()`, reports
  validity (`required`, and the native constraints where there is a native
  input), and is disabled by `<fieldset disabled>`. Each has `name`,
  `disabled`, `required`, `form`, `validity`, `validationMessage`,
  `checkValidity()`, `reportValidity()` and `setCustomValidity()`.
- **`label` is the accessible name**, never visible text. Visible text is the
  default slot, or a `<punica-field label>` around the control.
- **Tokens** are `--punica-*` (see the token map in [`MIGRATION-2.0.md`](../MIGRATION-2.0.md#tokens)); each
  element's own custom properties are `--punica-<element>-<property>`.
- **`fullwidth` is `full-width`**, and `rounded` is gone: controls have the
  token radius by default; set the element's `--punica-<element>-radius` to
  `0` for square corners.

## punica-icon-button

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-icon-button` | `punica-icon-button` |
| Inside | The host with `role="button"`, not focusable | A native `<button>`; the host delegates focus |
| Accessible name | none | `label` (required) |
| `color` | `primary` … `success` | the same, plus `neutral` (the default: the text colour) |
| `size` | `xsmall` (24) · `small` (32) · `medium` (40) · `large` (48) | `small` (28) · `medium` (36) · `large` (44); **`xsmall` removed**, use `--punica-icon-button-size` |
| `variant` | — | `text` (default) · `outlined` · `filled` |
| `type` | — | `button` (default) · `submit` · `reset` |
| `name`, `value` | — | submitted when the button submits its form |
| `disabled`, `loading` | attributes; styled with inline styles on the host | attributes; `loading` shows a spinner and sets `aria-busy` |
| Events | none | none (native `click`) |
| Slots | default | default |
| Parts | — | `base`, `spinner` |
| Custom properties | — | `--punica-icon-button-size`, `--punica-icon-button-radius`, `--punica-icon-button-icon-size` |
| Methods | — | `focus()`, `click()` |

## punica-input

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-input` | `punica-input` |
| `value` attribute | rewritten on every keystroke, so `form.reset()` went to the current value | the **default** value; never written by the element |
| `value` property | read from the attribute | the current value; `null` reads back as `''` |
| `type`, `placeholder`, `readonly`, `pattern`, `minlength`, `maxlength`, `autocomplete`, `inputmode`, `name`, `disabled`, `size` | attributes | the same; `readonly` is a boolean now (`readonly="false"` is read-only) |
| `required`, `min`, `max`, `step` | — | passed to the native input and validated |
| `label` | — | accessible name; a `<label for>` also names it |
| `clearable`, `label-clear` | — | a clear button, named `Clear` by default |
| `fullwidth` | attribute | `full-width` |
| `rounded` | attribute | removed (rounded by default; `--punica-input-radius`) |
| `error` | boolean attribute that painted the border red | removed. The border follows validity: `:state(user-invalid)`. For a server-side error call `setCustomValidity(message)`, or use `<punica-field error>` |
| `focus` attribute | written on the host while focused | removed; style `:focus-within` |
| `startadornment`, `endadornment` attributes | observed, unused | removed |
| `hidespinbutton` | attribute for `type="number"` | removed; use `<punica-number-input>` |
| `tabindex` property | hand-written accessor | removed; the native `tabindex` attribute works |
| Event `input` (`CustomEvent`, `{ value }`) | on every keystroke | `punica-input`, `{ value }` |
| — | no commit event | `punica-change`, `{ value }`, on blur or Enter after an edit |
| Events `focus`, `blur` (`CustomEvent`, `{ value }`) | synthetic | removed; the native `focus` / `blur` fire on the host. Read `event.target.value` |
| Event `keydown` (`CustomEvent`, `{ key }`) | synthetic; the native one was stopped | removed; the native `keydown` reaches the host with a real `key` |
| Enter | nothing | requests the submit of the owning form |
| Slots | `startAdornment`, `endAdornment` | `start`, `end` |
| Parts | — | `base`, `input`, `clear`, `icon` |
| Custom properties | `--input-border-radius`, `--input-border-color`, `--input-color` | `--punica-input-radius`, `--punica-input-border-color`, `--punica-input-color`, plus `--punica-input-height`, `--punica-input-padding`, `--punica-input-background` |
| States | — | `:state(valid)`, `:state(invalid)`, `:state(user-invalid)`, `:state(disabled)` |
| Methods | — | `focus()`, `select()`, `setSelectionRange()` |
| Validity | never reported | the native input's own, with its message |
| Heights | 32 / 40 / 48 | 28 / 36 / 44 (`--punica-size-*`) |

## punica-textarea

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-textarea` | `punica-textarea` |
| Form | not form-associated | a form control |
| `value` | attribute and property were one | attribute is the default, property the current value |
| `placeholder`, `rows`, `minlength`, `maxlength`, `disabled` | attributes | the same; `rows` defaults to 3 |
| `readonly`, `required`, `name`, `autocomplete`, `inputmode`, `label` | — | new |
| `resize` | — (never resizable) | `none` (default) · `vertical` · `auto` (grows with the content; `rows` is the least height, `--punica-textarea-max-height` the most) |
| `fullwidth` | attribute | `full-width` |
| `rounded` | attribute | removed (rounded by default; `--punica-textarea-radius`) |
| `error`, `focus` attributes | as on the input | removed, as on the input |
| Event `change` (`CustomEvent`, `{ value }`) | on every keystroke | `punica-input`, `{ value }`, on every keystroke; `punica-change`, `{ value }`, on commit |
| Slots | none | none |
| Parts | — | `base`, `textarea` |
| Custom properties | `--textarea-border-radius`, `--textarea-border-color`, `--textarea-color` | `--punica-textarea-radius`, `--punica-textarea-border-color`, `--punica-textarea-color`, plus `--punica-textarea-padding`, `--punica-textarea-background`, `--punica-textarea-max-height` |
| States | — | `:state(valid)`, `:state(invalid)`, `:state(user-invalid)`, `:state(disabled)` |
| Methods | — | `focus()`, `select()`, `setSelectionRange()` |

## punica-checkbox

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-checkbox` | `punica-checkbox` |
| Form | not form-associated | a form control; submits `value` while checked |
| Inside | a `display: none` input, unreachable by keyboard | a native checkbox laid over the drawn box: Tab reaches it, Space toggles |
| `checked` | attribute; drifted from the native state after a click | attribute and property follow the state both ways. `form.reset()` goes back to the state at first render |
| `indeterminate` | string attribute (`indeterminate="true"`) | boolean attribute; the next user toggle clears it |
| `label` | the visible text | the accessible name of a checkbox without text. **Visible text moves to the default slot**: `<punica-checkbox>Accept</punica-checkbox>` |
| `value`, `name`, `required`, `color` | — | new; `value` defaults to `on` |
| Event `change` (`{ value: checked }`, did not bubble) | | `punica-change`, `{ checked, value }`, bubbles and is composed |
| Slots | none | default (the label) |
| Parts | — | `base`, `input`, `control`, `icon`, `label` |
| Custom properties | `--checkbox-color` (the border) | `--punica-checkbox-border-color`, `--punica-checkbox-color` (the checked fill), `--punica-checkbox-size`, `--punica-checkbox-radius`, `--punica-checkbox-gap` |
| States | — | `:state(checked)`, `:state(indeterminate)`, `:state(valid)`, `:state(invalid)`, `:state(disabled)` |
| Methods | — | `focus()`, `click()` |

## punica-switch

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-switch` | `punica-switch` |
| Form | not form-associated | a form control; submits `value` (default `on`) while checked |
| Inside | `role="switch"` on the host and on an inner label, an `aria-hidden` checkbox, a hard-coded `aria-label="regular switch"` | one native `<button role="switch" aria-checked>`, named by the default slot or `label` |
| `state` (`"true"` / `"false"` string) | attribute and property | **`checked`**, a boolean attribute and property |
| `initstate="true"` | clicked the switch on connect | removed; write `checked` |
| `on-label`, `off-label` | attributes (`onLabel` / `offLabel` properties) | **`label-on`**, **`label-off`** (`labelOn` / `labelOff`) |
| `elastic` | stretch animation of the handle | removed |
| `name` | attribute, unused | the form name |
| `value`, `required`, `label`, `color`, `size` | — | new |
| Keyboard | Space and Enter through `keyCode` | Space and Enter, natively |
| RTL | `dir` attribute selectors and a `--dirLTR` multiplier | logical properties; follows the inherited direction |
| Moving the element | broke it: internals were nulled on disconnect | works |
| Event `change` (`{ state }`) | | `punica-change`, `{ checked, value }` |
| Slots | none | default (the label) |
| Parts | — | `base`, `track`, `thumb`, `label-on`, `label-off`, `label` |
| Custom properties | `--switch-lever--background`, `--switch-lever_checked--background`, `--switch-lever--handle-background`, `--switch-lever_checked--handle-background`, `--switch--on-text-color`, `--switch--off-text-color`, `--switch_checked--on-text-color`, `--switch_checked--off-text-color`, `--switch_focus--background`, `--switch_focus--outline-color`, `--switch_disabled--on-text-color`, `--switch_disabled--off-text-color` | `--punica-switch-track-color`, `--punica-switch-track-color-checked`, `--punica-switch-thumb-color`, `--punica-switch-width`, `--punica-switch-height`, `--punica-switch-gap`. The text colour properties are removed: the side in effect is bold, style `::part(label-on)` / `::part(label-off)`. Focus is `--punica-focus-ring` |
| Size | 4em × 2em, scaled by font size | 40 × 22 px; `size` or `--punica-switch-width` / `-height` |
| States | — | `:state(checked)`, `:state(valid)`, `:state(invalid)`, `:state(disabled)` |
| Methods | — | `focus()`, `click()` |

## punica-toggle-button

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-toggle-button` | `punica-toggle-button` |
| Inside | the host itself | a native `<button aria-pressed>` |
| `selected` | boolean attribute | **`pressed`** |
| `value` | default `on` | no attribute default; a lone pressed button still submits `on` |
| `mode` (`switch` \| `radio`) | a `radio` button could not be released by a click | removed; put the buttons in a `<punica-toggle-button-group>` |
| `color` | `primary` … `success`, `ghost`; coloured the button at rest | accent of the **pressed** state; at rest the button is outlined and neutral. `ghost` removed, `neutral` added |
| `size` | `small` · `medium` · `large` (32 / 40 / 48) | the same names (28 / 36 / 44) |
| `rounded` | attribute | removed (rounded by default) |
| `name`, `disabled` | attributes | the same |
| `required`, `label` | — | new |
| Event `change` (`{ value: selected, name }`) | | `punica-change`, `{ pressed, checked, value }`; `checked` equals `pressed`, `value` is the `value` attribute |
| Slots | `active`, `passive` (shown while selected / not) | default, `start`, `end`. **`active` / `passive` removed**: put both in the default slot and show one with `punica-toggle-button:state(pressed) .on { … }` in your own CSS |
| Parts | — | `base`, `label` |
| Custom properties | `--toggle-button-border-radius` | `--punica-toggle-button-radius` (and one per corner: `-radius-start-start`, `-start-end`, `-end-start`, `-end-end`), `--punica-toggle-button-height`, `--punica-toggle-button-padding`, `--punica-toggle-button-border-color` |
| States | — | `:state(pressed)`, `:state(valid)`, `:state(invalid)`, `:state(disabled)` |
| In a group | submitted on its own as well | submits nothing; the group owns the value |

## punica-toggle-button-group

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-toggle-button-group` | `punica-toggle-button-group` |
| Form | not form-associated | a form control |
| `value` | attribute, rewritten on every click | attribute is the default, property the current value |
| `defaultvalue` | attribute | removed; that is what the `value` attribute is now. With no `value`, the buttons' own `pressed` gives the first value |
| `multiple` | — | several pressed buttons; `value` is their values separated by spaces (so a value cannot contain a space), `values` the same as a list, and each is its own form entry |
| `size`, `color` | copied onto every button | removed; set them on the buttons |
| `orientation` | `horizontal` · `vertical` | the same; also the arrow-key axis |
| `fullwidth` | attribute | `full-width` |
| `disabled` | attribute | the same; also from a fieldset |
| `name`, `required`, `label` | — | new |
| Keyboard | every button was a tab stop | one tab stop (roving tabindex); arrows, Home and End move focus, Space or Enter presses |
| Role | none | `toolbar`, through ElementInternals |
| Releasing the pressed button | not possible | a second click releases it and `value` is `''` (use `required` to demand a choice) |
| Event `change` (`{ value }`) | | `punica-change`, `{ value, values }`, fired by the group only; a button's own `punica-change` does not leave the group |
| Slots | default | default |
| Custom properties | none | none (the group sets the buttons' corner radii) |
| States | — | `:state(valid)`, `:state(invalid)`, `:state(disabled)` |
| Methods | — | `focus()` |

## New in 2.0

### punica-radio-group and punica-radio

| | |
|---|---|
| `punica-radio-group` attributes | `value` (default; the property is current), `name`, `label`, `orientation` (`vertical` default), `disabled`, `required` |
| `punica-radio` attributes | `value`, `checked` (set by the group), `disabled`, `color` |
| Events | `punica-change` on the group, `{ value }` |
| Slots | group: default (the radios); radio: default (the label) |
| Parts | radio: `control`, `label` |
| Custom properties | `--punica-radio-group-gap`; `--punica-radio-size`, `--punica-radio-border-color`, `--punica-radio-color`, `--punica-radio-gap` |
| States | group: `valid`, `invalid`, `disabled`; radio: `checked`, `disabled` |
| Keyboard | one tab stop; arrows, Home, End move and select; Space selects |

### punica-segmented-control and punica-segmented-control-item

| | |
|---|---|
| Control attributes | `value`, `name`, `label`, `disabled`, `required`, `size`, `full-width` |
| Item attributes | `value`, `selected` (set by the control), `disabled` |
| Events | `punica-change` on the control, `{ value }` |
| Slots | control: default (the items); item: default, `start` |
| Parts | control: `base`, `indicator`; item: `base` |
| Custom properties | `--punica-segmented-control-height`, `-radius`, `-background`, `-indicator-color`; `--punica-segmented-control-item-padding` |
| States | control: `valid`, `invalid`, `disabled`; item: `selected`, `disabled` |
| Keyboard | as the radio group |

### punica-slider

| | |
|---|---|
| Attributes | `value` (default; the property is the current number), `min` (0), `max` (100), `step` (1), `name`, `label`, `orientation`, `disabled`, `color` |
| Events | `punica-input` `{ value }` while dragging and on a key; `punica-change` `{ value }` on a key and at the end of a drag |
| Parts | `base`, `track`, `fill`, `thumb` |
| Custom properties | `--punica-slider-length`, `-track-size`, `-thumb-size`, `-track-color`, `-color` |
| States | `dragging`, `disabled` |
| Methods | `stepUp(n)`, `stepDown(n)` |
| Keyboard | arrows (mirrored in RTL), PageUp / PageDown, Home, End |

### punica-number-input

| | |
|---|---|
| Attributes | `value` (default; the property is a number or `null`), `min`, `max`, `step` (1), `name`, `label`, `placeholder`, `disabled`, `readonly`, `required`, `label-increment`, `label-decrement`, `size`, `full-width` |
| Properties | `formatOptions` (`Intl.NumberFormatOptions` for the unfocused display) |
| Events | `punica-input` `{ value }`, `punica-change` `{ value }` |
| Slots | `start`, `end` |
| Parts | `base`, `input`, `steppers`, `decrement`, `increment`, `icon` |
| Custom properties | `--punica-number-input-height`, `-padding`, `-radius`, `-border-color`, `-background`, `-color` |
| States | `valid`, `invalid`, `user-invalid`, `disabled` |
| Methods | `focus()`, `select()`, `stepUp(n)`, `stepDown(n)` |
| Replaces | `<punica-input type="number" hidespinbutton>` |

### punica-file-input

| | |
|---|---|
| Attributes | `accept`, `multiple`, `name`, `label`, `label-browse`, `label-drop`, `disabled`, `required` |
| Properties | `files` (`File[]`) |
| Events | `punica-change`, `{ files }` |
| Parts | `base`, `icon`, `button`, `hint`, `list`, `file` |
| Custom properties | `--punica-file-input-padding`, `-radius`, `-border-color`, `-background` |
| States | `dragover`, `filled`, `valid`, `invalid`, `disabled` |
| Methods | `focus()`, `showPicker()` |

### punica-field

| | |
|---|---|
| Attributes | `label`, `help`, `error`, `required` |
| Properties | `control` (read-only: the element in the default slot) |
| Events | none |
| Slots | default (one control), `label`, `help` |
| Parts | `label`, `required`, `help`, `error` |
| Custom properties | `--punica-field-gap`, `-label-color`, `-help-color`, `-error-color` |
| States | `invalid`, `required` |
| Replaces | the `error` attribute of the 1.x input and textarea, and the `label` text of the 1.x checkbox |
