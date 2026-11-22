# @punica/components 2.0: how to use it

Framework-free custom elements, all named `punica-*`. Version 2.0 is a clean
break from 1.x: names you may remember from 1.x (`punica-typography`,
`punica-modal`, `change` events, `startIcon` slots, `fullwidth`) are wrong.
Use only the tags, attributes, events and slots this document lists; never
guess one.

## Loading

```html
<!-- No build step: one classic script, global `Punica` -->
<script src="https://cdn.jsdelivr.net/npm/@punica/components@2/dist/punica-components.min.js"></script>
```

```js
import '@punica/components';                                // every element
import '@punica/components/components/button/button.js';    // one element
import { toast } from '@punica/components';                 // toast('Saved', { color: 'success' })
```

## Rules that hold for every element

- **Attributes are kebab-case**: `full-width`, `label-close`, `no-light-dismiss`.
  HTML lowercases `fullWidth` to `fullwidth`, which is not an attribute.
- **Booleans follow HTML**: present means on. `disabled="false"` is still
  disabled; leave the attribute out instead.
- **Enumerations** take exactly the listed values. Shared ones:
  `size`: `small | medium | large`; `color`: `primary | secondary | error |
  warning | info | success | neutral`; `orientation`: `horizontal | vertical`.
- **Events are `punica-*`**, bubbling and composed: `punica-input` (while
  editing), `punica-change` (committed), `punica-select`, `punica-open`,
  `punica-close`, `punica-toggle`, `punica-dismiss`. No element fires a
  native `change`, `input`, `select` or `close`; a listener for those never
  runs. Read the value from `event.detail` (`detail.value`, `detail.checked`).
  A change made from script fires nothing.
- **Native `click`, `focus`, `keydown`** pass through as usual.
- **Slots**: `start` and `end` hold leading and trailing content (icons,
  adornments). Other slot names are per element.
- **Data** (arrays, objects, functions) is a property set from script, never
  an attribute: `table.rows = [...]`.
- **Accessible names**: a control's `label` attribute, or its text content.
  An icon-only control needs `label`.
- **Icons**: `<punica-icon name="…">` draws only the built-in glyphs listed
  under `punica-icon`. For any other icon, put an `<svg>` inside
  `<punica-icon>` or in the control's `start` slot.

## Forms

Every element that takes a value is a real form control: give it `name` and
it is in `FormData`, reset with the form, validated (`required`, `min`,
`max`), disabled by `<fieldset disabled>`. Wrap a control in `punica-field`
for a label, help text and an error message:

```html
<form>
  <punica-field label="Email" help="We never share it.">
    <punica-input name="email" type="email" required></punica-input>
  </punica-field>
  <punica-button type="submit">Subscribe</punica-button>
</form>
```

## Overlays

Dialogs, menus, popovers and drawers open in the browser's top layer: no
z-index, no portal. Open them with the `open` attribute (dialogs, drawers,
sheets and menus also have `show()` and `hide()`); they fire `punica-open` and `punica-close` (with
`detail.reason`).

## Theming

Design tokens are `--punica-*` custom properties, built in. Override any of
them; set `color-scheme` for light and dark:

```css
:root {
  color-scheme: light dark;
  --punica-color-primary: light-dark(#0b57d0, #a8c7fa);
  --punica-radius: 8px;
}
```

Restyle inside an element with `::part(name)` and `:state(name)`; each
element lists its parts, states and its own `--punica-<element>-*`
properties. Right-to-left works with `dir="rtl"` on any ancestor.

## Frameworks

- **React 19**: props that name a property are set as properties; listen
  with `on` + the event name: `onpunica-change={(e) => set(e.detail.value)}`.
  `onChange` never fires.
- **React 18**: props become string attributes and custom events are not
  wired: add listeners with a `ref` and `useEffect`, and set data properties
  on the ref.
- **Vue**: `@punica-change="…"`, `:value="…"`; mark `punica-*` as custom
  elements (`compilerOptions.isCustomElement`).
- **Angular**: `CUSTOM_ELEMENTS_SCHEMA`, `(punica-change)="…"`, `[value]="…"`.

## Testing

Elements carry their role through `ElementInternals`: a `punica-heading` is
a heading and a `punica-table-row` a row to a screen reader, with no `role`
attribute in the markup. Tools that read the markup instead of the
accessibility tree do not see those roles yet: Playwright's `getByRole`,
Testing Library's `getByRole`, and rules of axe-core such as
`page-has-heading-one`. In tests, find such an element by its tag
(`page.locator('punica-table-row')`); for the one heading of a page that an
audit has to find, use a native `<h1>`. Roles of native elements inside an
element (the `button` in a `punica-button`, the `dialog` in a
`punica-alert-dialog`) are found as usual.

## Check your work

`npx punica-components validate <files>` checks tags, attributes, values,
slots, events and icon names against this version and exits 1 on an error.
`npx punica-components info <tag>` prints one element's whole API.
Documentation with live examples: https://components.punicalab.com
