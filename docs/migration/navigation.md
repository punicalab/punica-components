# Migrating selection and navigation from 1.x to 2.0

Eight 1.x families were rewritten (tabs, accordion, the two select lists, the
list view, pagination, the button group, the split) and seven are new
(collapsible, accordion group, breadcrumbs, stepper, tree, carousel, overflow
list). What holds for every element below:

- **Events are `punica-*`**, bubbling and composed, and fire for what the user
  did. A change made from script (`el.value = …`, `el.open = true`, `next()`)
  fires nothing. No element fires `change`, `changeExpanded` or `split-change`.
- **Parents find their children, children never call the parent.** 1.x items
  called `parentElement.itemAdd(this)` and threw when the parent was not
  defined yet. In 2.0 either may be defined, created or connected first.
- **Booleans follow HTML.** `disabled="false"` is disabled; remove the
  attribute or set the property to `false`. `null` removes an attribute.
- **Multi-word attributes are kebab-case**: `fullwidth` → `full-width`,
  `totalCount` → `total-count`, `enabledivider` → `dividers`.
- **Roles and ARIA state live on `ElementInternals`** (or on a native element
  inside the shadow root), so they do not show as host attributes. The
  exceptions are the id references between a tab and its panel, the
  collapsible's trigger, and `tabindex` for a roving tab stop.
- **Every string a person hears is an attribute** with an English default
  (`label-next="Next page"`); numbers go through `Intl.NumberFormat` in the
  language of the closest `[lang]`.
- **Tokens** are `--punica-*` (see the token map in [`MIGRATION-2.0.md`](../MIGRATION-2.0.md#tokens)); each
  element's own custom properties are `--punica-<element>-<property>`.

## punica-tabs (was punica-tab)

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-tab` (the container) | `punica-tabs` |
| Children | `punica-tab-item`; panels lived anywhere and were told the value by hand | `punica-tab` and `punica-tab-panel` as direct children |
| `value` | value of the selected item | the same; the first enabled tab when absent |
| `orientation` | `horizontal` · `vertical` | the same, `horizontal` by default |
| `activation` | — | `auto` (arrows select, the default) · `manual` (Enter or Space selects) |
| `label` | — | accessible name of the tab list |
| `fullwidth` | boolean | `full-width` |
| `disabled` | boolean | the same |
| Properties | `value`, `orientation`, `fullwidth`, `disabled` | `value`, `orientation`, `activation`, `label`, `fullWidth`, `disabled`, plus read-only `tabs`, `panels`, `selectedTab` |
| Methods | `itemAdd(item)`, `itemRemove(item)` | **removed**; children are read from the slot |
| Event | `change` `{ value }` | `punica-change` `{ value }` |
| Slots | default (the items) | `tab` (the tabs; a tab places itself there), default (the panels) |
| Parts | — | `tablist`, `indicator`, `panels` |
| Custom properties | — | `--punica-tabs-indicator-color`, `--punica-tabs-indicator-size`, `--punica-tabs-border-color`, `--punica-tabs-gap` |
| Roles | none | `tablist` on the `tablist` part, with `aria-orientation` and `aria-label` |
| Keyboard | none | arrow keys by orientation (mirrored in RTL), Home, End, Enter and Space in `manual`; one tab stop |
| Selected mark | a border on the item | one indicator that slides under the selected tab |

## punica-tab (was punica-tab-item)

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-tab-item` | `punica-tab` (1.x used this name for the container) |
| `value` | pairs with the panel | the same; the tab's position (`"0"`, `"1"`, …) when absent |
| `selected` | boolean, set by the parent | the same; set by `punica-tabs`, do not write it |
| `disabled` | — | the tab is skipped by keys and clicks |
| Events | click was listened to by the parent | none of its own |
| Slots | default | default, `start`, `end` |
| Parts | — | `base` |
| Custom properties | — | `--punica-tab-padding`, `--punica-tab-color`, `--punica-tab-selected-color`, `--punica-tab-hover-background` |
| State | — | `:state(selected)` |
| Role | none | `tab`, `aria-selected`, `aria-controls` (the panel's id, generated when missing) |
| Look | unselected tabs at 60 % opacity | full-contrast text; the selected tab takes the primary colour |
| Removed | `:host-context(punica-tab[orientation])` styling | the container styles its tabs |

## punica-tab-panel

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-tab-panel` | `punica-tab-panel`, a direct child of `punica-tabs` |
| `value` | pairs with the tab | the same; its position when absent |
| `selectedvalue` | set by the page to show or hide the panel | **removed**; `punica-tabs` shows the matching panel |
| `active` | — | boolean set by `punica-tabs` |
| Showing | inline `display` on the host; the slot was created and removed | `:host(:not([active]))` is `display: none`; the content stays in the DOM |
| Slots | default (only while selected) | default |
| Parts | — | `base` |
| Custom properties | — | `--punica-tab-panel-padding` (16px; 1.x had none) |
| State | — | `:state(active)` |
| Role | none | `tabpanel`, `aria-labelledby` (the tab's id), `tabindex="0"` |

## punica-accordion

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-accordion` with `punica-accordion-summary` and `punica-accordion-details` children | `punica-accordion` alone |
| `expanded` | boolean; also read as `expanded="true"` in CSS | `open` |
| `rounded` | boolean | the same |
| `disabled` | — | the summary takes no click and no focus |
| `heading-level` | — | 1 to 6: the summary is exposed as a heading of that level |
| Properties | `expanded`, `rounded` | `open`, `disabled`, `rounded`, `headingLevel` |
| Methods | `addSummary(summary)` | **removed**; `show()`, `hide()`, `toggle()`, `focus()` |
| Event | `changeExpanded` `{ expanded }` | `punica-toggle` `{ open }` |
| Summary | `<punica-accordion-summary>` with slots `icon`, `content`, `actions`, `expandIcon` | slots on the accordion: `start`, `summary`, `end`, `indicator` |
| Content | `<punica-accordion-details>` | the default slot |
| Parts | — | `header`, `summary`, `label`, `indicator`, `region`, `content` |
| Custom properties | `--accordion-border-radius`, `--accordion-summary-padding`, `--accordion-details-padding` | `--punica-accordion-radius`, `--punica-accordion-summary-padding`, `--punica-accordion-content-padding`, `--punica-accordion-background`, `--punica-accordion-duration` |
| State | — | `:state(open)` |
| Semantics | `aria-expanded` on the host, no button, no keyboard | a native `<button aria-expanded aria-controls>` in the shadow root and a `role="region"` labelled by it |
| Motion | none (display toggled) | the height animates; the duration token is 0 under reduced motion |
| Closed content | `display: none` | `visibility: hidden` at zero height: out of the tab order and the accessibility tree |

Before and after:

```html
<!-- 1.x -->
<punica-accordion expanded>
  <punica-accordion-summary><span slot="content">Shipping</span></punica-accordion-summary>
  <punica-accordion-details>Two days.</punica-accordion-details>
</punica-accordion>

<!-- 2.0 -->
<punica-accordion open>
  <span slot="summary">Shipping</span>
  Two days.
</punica-accordion>
```

## punica-accordion-summary, punica-accordion-details

Removed. See the `summary`, `start`, `end` and `indicator` slots and the
default slot of `punica-accordion`.

| 1.x | 2.0 |
|---|---|
| `<punica-accordion-summary>` | gone |
| slot `content` | `slot="summary"` on the accordion |
| slot `icon` | `slot="start"` |
| slot `actions` | `slot="end"` (outside the button, so it may hold buttons) |
| slot `expandIcon` | `slot="indicator"` |
| `--accordion-summary-padding` | `--punica-accordion-summary-padding` |
| `<punica-accordion-details>` | gone; its content is the accordion's default slot |
| `--accordion-details-padding` | `--punica-accordion-content-padding` |

## punica-accordion-group (new)

| | 2.0 |
|---|---|
| Tag | `punica-accordion-group` |
| `multiple` | several sections may be open; when absent, opening one closes the others and only the first `open` section of the markup stays open |
| Properties | `multiple`, read-only `items` |
| Events | none of its own; it listens to its direct children's `punica-toggle` |
| Slots | default: `punica-accordion` elements |
| Custom properties | `--punica-accordion-group-gap`, `--punica-accordion-group-divider` |

## punica-collapsible (new)

| | 2.0 |
|---|---|
| Tag | `punica-collapsible` |
| `open` | the content is showing |
| `disabled` | the trigger does not toggle |
| Methods | `show()`, `hide()`, `toggle()` |
| Event | `punica-toggle` `{ open }` |
| Slots | `trigger` (a native `<button>`; it gets `aria-expanded` and `aria-controls`), default (the content) |
| Parts | `content` |
| Custom properties | `--punica-collapsible-duration` |
| State | `:state(open)` |
| Note | `aria-controls` names the host, which gets a generated `id` when it has none: the region is in the shadow root, out of reach of an id reference |

## punica-listbox (was punica-single-select-list and punica-multi-select-list)

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-single-select-list`, `punica-multi-select-list` | `punica-listbox`, with `multiple` for the second |
| `value` attribute | the selection, kept in sync; comma-separated in the multi list | the **default** value (a form reset goes back to it); with `multiple` a JSON array or a comma-separated list |
| `value` property | a string in both lists | the current selection: a string or `null`; an **array** with `multiple` |
| `multiple` | a different element | boolean |
| `name`, `disabled`, `required` | — | form control attributes |
| `label` | — | accessible name |
| `orientation` | — | `vertical` (default) · `horizontal`: the direction the arrow keys follow |
| Properties | `value` | `value`, `defaultValue`, `multiple`, `name`, `disabled`, `required`, `label`, `orientation`, `form`, `labels`, `validity`, `validationMessage`, `willValidate`, read-only `items`, `selectedItems` |
| Methods | `itemAdded(item)`, `itemRemoved(item)` | **removed**; `focus()`, `checkValidity()`, `reportValidity()`, `setCustomValidity()` |
| Event | `change` `{ value }`, plus `selectedValues` in the multi list | `punica-change` `{ value }` (the array with `multiple`); **`selectedValues` removed** |
| Slots | default | default: `punica-listbox-item` elements |
| Custom properties | — | `--punica-listbox-background`, `--punica-listbox-padding`, `--punica-listbox-radius`, `--punica-listbox-max-height` |
| States | — | `:state(disabled)`, `:state(invalid)`, `:state(valid)` |
| Form | not a form control | in `FormData` (once per value with `multiple`), left out when disabled or inside `<fieldset disabled>`, restored by `form.reset()`, `required` |
| Role | none | `listbox`, `aria-multiselectable`, `aria-orientation`, `aria-required`, `aria-disabled` |
| Keyboard | none | Up/Down (or Left/Right, mirrored in RTL), Home, End, type-ahead; single: selection follows focus, Space or Enter selects; multiple: Space toggles, Shift+arrow extends, Ctrl+A selects all or none, Shift+click selects a range; one tab stop |
| `document.createElement` | threw in the single list (an attribute was set in the constructor) | works |

## punica-listbox-item (was punica-single-select-list-item and punica-multi-select-list-item)

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-single-select-list-item`, `punica-multi-select-list-item` | `punica-listbox-item` |
| `value` | the item's value | the same; the item's text when absent |
| `selected` | set by the parent | in markup, a default selection (when the listbox has no `value` attribute); afterwards set by the listbox from its value |
| `disabled` | — | skipped by keys and clicks |
| Slots | default | default, `start`, `end` |
| Parts | — | `base`, `label`, `check` |
| Custom properties | — | `--punica-listbox-item-padding`, `--punica-listbox-item-hover-background`, `--punica-listbox-item-selected-background` |
| State | — | `:state(selected)` |
| Role | none | `option`, `aria-selected`, `aria-disabled` |
| Look | multi: selected and hovered rows on `--highlight` with white text | both: `--punica-color-hover` under the pointer, `--punica-color-selected` and a check mark when selected |

## punica-list (was punica-list-view)

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-list-view` | `punica-list` |
| `enabledivider` | boolean; wrote `data-divider` on every child | `dividers`; a `::slotted` rule, nothing is written on the children |
| `spacing` | a number multiplied by 8px, passed to an inner `punica-row` | **removed**; set `--punica-list-gap` |
| `dense` | — | tighter rows |
| `label` | — | accessible name |
| Properties | `enabledivider`, `spacing` | `dividers`, `dense`, `label`, read-only `items` |
| Events | none | none (an interactive item fires `punica-select`, which bubbles) |
| Slots | default | default: `punica-list-item` elements |
| Custom properties | `--list-view-border-radius`, `--list-view-spacing`, `--divider` | `--punica-list-radius`, `--punica-list-gap`, `--punica-list-divider`, `--punica-list-padding` |
| Role | none | `list` |
| Reconnect | appended its template again on every connect | one shadow tree, cloned once |
| Removed | the inner `punica-row`; the inline `--list-view-spacing` on the host | |

## punica-list-item (was punica-list-view-item)

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-list-view-item` | `punica-list-item` |
| `interactive` | — | the row holds a native `<button>`, or an `<a>` with `href` |
| `href`, `target`, `rel` | — | the link of an interactive row |
| `selected` | — | the current row: `aria-current="true"` on the control, a selected background |
| `disabled` | — | an interactive row that takes no click and no focus |
| `value` | — | carried in `punica-select` |
| Event | none | `punica-select` `{ value, item }` when an interactive row is activated |
| Slots | default | default, `start`, `end` (`end` is outside the button or link) |
| Parts | — | `row`, `base`, `content` |
| Custom properties | — | `--punica-list-item-padding`, `--punica-list-item-min-height`, `--punica-list-item-gap`, `--punica-list-item-hover-background`, `--punica-list-item-selected-background` |
| State | — | `:state(selected)` |
| Role | none | `listitem` |
| Look | a bare block with no padding | a 44px row with 8px/16px padding; set `--punica-list-item-padding: 0` and `--punica-list-item-min-height: 0` for the 1.x look |

## punica-pagination

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-pagination` | the same |
| `page` | current page | the same, from 1; shown clamped to the pages there are |
| `totalCount` | observed in camelCase, so the attribute never fired | `total-count` (property `totalCount`) |
| `size` | records per page | `page-size` (property `pageSize`), 10 by default |
| `sibling-count` | — | pages on each side of the current one, 1 by default |
| `label` | — | name of the `<nav>`, `Pagination` by default |
| `label-previous`, `label-next` | — | names of the two arrow buttons |
| `label-page` | — | name of a page button, `Page {page}` by default |
| `disabled` | — | no button takes a click |
| Properties | `page`, `totalCount`, `size` | `page`, `totalCount`, `pageSize`, `siblingCount`, `label`, `labelPrevious`, `labelNext`, `labelPage`, `disabled`, read-only `pageCount`, `currentPage` |
| Methods | `paginate()`, `prevButtonClick()`, `nextButtonClick()`, `update()` as public API | **removed** |
| Event | none: a click wrote the `page` attribute | `punica-change` `{ page }` (also `{ value }`) |
| Slots | `prevPage`, `nextPage` | `previous`, `next` (a chevron by default) |
| Parts | — | `base`, `list`, `previous`, `next`, `page`, `current`, `ellipsis` |
| Custom properties | — | `--punica-pagination-gap`, `--punica-pagination-size`, `--punica-pagination-radius`, `--punica-pagination-current-background`, `--punica-pagination-current-color` |
| Inside | `punica-row`, `punica-col`, `punica-button`, `punica-typography`; the current page was a button at 30 % opacity | a `<nav>` holding a list of native buttons; the current page has `aria-current="page"` and the primary background |
| Numbers | raw | `Intl.NumberFormat` in the element's language |
| Listeners | added on every update, and the wrong one removed | one delegated listener, added once |

## punica-button-group

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-button-group` | the same |
| `variant`, `size`, `color`, `disabled` | copied onto every child by attribute writes | **removed**; set them on each button |
| `fullwidth` | boolean | `full-width` |
| `orientation` | — | `horizontal` (default) · `vertical` |
| `label` | — | accessible name of the group |
| Properties | `size`, `variant`, `color`, `disabled`, `fullwidth` | `label`, `orientation`, `fullWidth` |
| Methods | `applyNewStyle()` | **removed** |
| Events | none | none |
| Slots | default: `punica-button` | default: `punica-button`, `punica-icon-button`, `punica-toggle-button` |
| Custom properties | — | `--punica-button-group-radius` |
| Role | none | `group` |
| Joining | `border-radius: 0 !important` on the child hosts | `::slotted` rules set each child's own `--punica-button-radius`, `--punica-icon-button-radius` or `--punica-toggle-button-radius`; mirrored in RTL, top to bottom when vertical |
| Between buttons | a light grey line after a filled button | outlined neighbours overlap by one border; others are parted by one border width |

## punica-split

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-split` | the same |
| Panes | any number, in the default slot | **two**: `slot="start"` and `slot="end"`; nest a split in a pane for more |
| `sizes` | a list of percentages | **removed**; `position`, the percent of the start pane (50 by default) |
| `min` | smallest pane size in px | smallest `position` in percent (0 by default) |
| `max` | — | largest `position` in percent (100 by default) |
| `step` | keyboard step | the same, in percent (1 by default); Page Up and Page Down move ten steps |
| `orientation` | `horizontal` · `vertical` | the same |
| `label` | — | name of the divider, `Resize` by default |
| `disabled` | — | the divider cannot be moved |
| `no-transition` | boolean | **removed**; the panes do not animate |
| Properties | `orientation`, `sizes`, `min`, `step` | `orientation`, `position`, `min`, `max`, `step`, `label`, `disabled` |
| Methods | `setSizes(arr)`, `getSizes()`, `reset()` | **removed**; write `position` |
| Events | `split-change` `{ sizes, final }` | `punica-input` `{ position }` while dragging, `punica-change` `{ position }` at the end of a drag and on a key (both also carry `{ value }`) |
| Slots | default | `start`, `end` |
| Parts | — | `base`, `start`, `end`, `divider` |
| Custom properties | `--split-gutter-size`, `--split-gutter-hitbox`, `--split-gutter-color`, `--split-gutter-hover`, `--split-pane-bg`, `--split-transition` | `--punica-split-divider-size`, `--punica-split-divider-line`, `--punica-split-divider-color`, `--punica-split-divider-active-color`; **`--split-pane-bg` and `--split-transition` removed** (style the slotted panes) |
| State | class `dragging` on the gutter | `:state(dragging)` |
| Divider | a focusable gutter | `role="separator"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-orientation`, `aria-controls`, `tabindex="0"` |
| Keyboard | arrows | Left/Right (mirrored in RTL) or Up/Down by orientation, Home, End, Page Up, Page Down |
| Pointer | document-level move listeners, `user-select` class on the body | pointer capture on the divider; nothing outside the element |
| Reconnect | duplicated its shadow tree | one shadow tree |

## punica-breadcrumbs, punica-breadcrumb-item (new)

| | `punica-breadcrumbs` | `punica-breadcrumb-item` |
|---|---|---|
| Attributes | `label` (`Breadcrumb`), `max-items`, `label-more` (`Show more`) | `href`, `target`, `rel`, `current` |
| Properties | `label`, `maxItems`, `labelMore`, read-only `items` | `href`, `target`, `rel`, `current` |
| Events | none (the popover's `punica-open` / `punica-close` bubble) | none; the native `click` of the link |
| Slots | default | default, `start`, `separator` |
| Parts | `base`, `list`, `more-item`, `more`, `separator`, `menu` | `link`, `separator` |
| Custom properties | `--punica-breadcrumbs-gap` | `--punica-breadcrumb-item-color`, `--punica-breadcrumb-item-current-color`, `--punica-breadcrumb-item-gap`, `--punica-breadcrumb-item-separator-display` |
| Semantics | `<nav aria-label>` holding an `<ol>`; with `max-items` the middle items move into a `punica-popover` behind a named button | `listitem`; an `<a>` (no `href`: plain text), `aria-current="page"` with `current` |

## punica-stepper, punica-step (new)

| | `punica-stepper` | `punica-step` |
|---|---|---|
| Attributes | `value`, `orientation`, `linear`, `label` | `value`, `label`, `description`, `state` (`complete` · `error`), `disabled`, `label-complete` (`Completed`), `label-error` (`Error`); set by the stepper: `active`, `orientation` |
| Properties | the same, plus read-only `steps`, `activeIndex` | the same, plus `index` and `interactive` (set by the stepper) |
| Methods | `next()`, `previous()` | `focus()` |
| Events | `punica-change` `{ value }` | none |
| Slots | default | default (the title), `description` |
| Parts | — | `base`, `marker`, `label`, `description`, `connector` |
| Custom properties | `--punica-stepper-gap` | `--punica-step-marker-size`, `--punica-step-color`, `--punica-step-error-color`, `--punica-step-connector-color`, `--punica-step-gap`, `--punica-step-connector-display` |
| State | — | `:state(active)` |
| Semantics | `list` | `listitem`; a native `<button>` unless the stepper is `linear`; `aria-current="step"` on the active one |

## punica-tree, punica-tree-item (new)

| | `punica-tree` | `punica-tree-item` |
|---|---|---|
| Attributes | `selection` (`none` · `single` · `multiple`), `label` | `label`, `value`, `expanded`, `selected`, `disabled`, `lazy`; set by the item: `loading` |
| Properties | the same, plus read-only `items`, `selectedItems`, `visibleItems` | the same |
| Methods | `expandAll()`, `collapseAll()` | — |
| Events | `punica-select` `{ value, item }` | `punica-toggle` `{ open, item }`, `punica-load` `{ item }` (both bubble to the tree) |
| Slots | default | default (child items), `label`, `start`, `end` |
| Parts | — | `row`, `toggle`, `label`, `spinner`, `group` |
| Custom properties | `--punica-tree-indent` | `--punica-tree-item-indent`, `--punica-tree-item-padding`, `--punica-tree-item-hover-background`, `--punica-tree-item-selected-background` |
| State | — | `:state(branch)` |
| Semantics | `tree`, `aria-multiselectable` | `treeitem` with `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded`, `aria-selected`, `aria-busy`; children in a `role="group"` |
| Keyboard | Up, Down, Home, End, Right (expand, then first child), Left (collapse, then parent), mirrored in RTL, `*` expands the siblings, type-ahead, Enter and Space select (Enter toggles when nothing is selectable); one tab stop | |

## punica-carousel, punica-carousel-item (new)

| | `punica-carousel` | `punica-carousel-item` |
|---|---|---|
| Attributes | `index`, `loop`, `autoplay`, `interval`, `label`, `label-previous`, `label-next`, `label-pause`, `label-play`, `label-slide` (`{index} of {total}`), `label-dots`, `roledescription`, `slide-roledescription` | `label`; set by the carousel: `active` |
| Properties | the same, plus read-only `items`, `currentIndex`, `playing` | the same, plus `positionLabel`, `roledescription` (set by the carousel) |
| Methods | `next()`, `previous()`, `pause()`, `play()` | — |
| Events | `punica-change` `{ index }` (also `{ value }`) | none |
| Slots | default | default |
| Parts | `base`, `track`, `controls`, `previous`, `next`, `pause`, `dots`, `dot`, `dot-active` | `base` |
| Custom properties | `--punica-carousel-gap`, `--punica-carousel-slide-size`, `--punica-carousel-dot-size`, `--punica-carousel-dot-color`, `--punica-carousel-dot-active-color` | — |
| State | `:state(playing)` | `:state(active)` |
| Semantics | `region` with `aria-roledescription`; dots are a `tablist` of `tab` buttons | `group` with `aria-roledescription` and an `aria-label` of its position; `inert` while not showing |
| Autoplay | stops while the pointer or focus is inside and when paused; starts paused under reduced motion; an automatic advance fires no event | |

## punica-overflow-list (new)

| | 2.0 |
|---|---|
| Tag | `punica-overflow-list` |
| `label-more` | name of the button that opens the overflowing children, `More` by default |
| Properties | `labelMore`, read-only `overflowCount` |
| Methods | `layout()` |
| Event | `punica-overflow` `{ count }` when the number of overflowing children changes |
| Slots | default |
| Parts | `base`, `items`, `more`, `menu` |
| Custom properties | `--punica-overflow-list-gap`, `--punica-overflow-list-menu-gap` |
| How | a `ResizeObserver` on the host and a `MutationObserver` on its children, both disconnected with the element; children are re-slotted, never moved in the DOM |
