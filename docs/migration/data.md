# Migration 1.x → 2.0: agenda, virtual list, virtual table

All three now extend `PunicaElement`, take their data as properties, fire
only `punica-*` events and read every colour from the `--punica-*` tokens.
The tag names are unchanged; almost everything else moved.

## `punica-agenda`

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-agenda` | `punica-agenda` |
| Base class | `HTMLElement` | `PunicaElement` |
| Attribute | `starthour` | `start-hour` (property `startHour`), whole hours 0–23 |
| Attribute | `endhour` | `end-hour` (property `endHour`), whole hours 1–24 |
| Attribute | none | `view` (`day` \| `week` \| `month` \| `year`, default `day`) |
| Attribute | none | `date` (`YYYY-MM-DD`, default today): a date inside the period shown |
| Attribute | none | `locale` (BCP 47; default the nearest `lang`, then `navigator.language`; 1.x defaulted to `en-US`) |
| Attribute | none | `first-day-of-week` (0 Sunday … 6 Saturday; default the locale's; 1.x was always Monday) |
| Attribute | none | `no-toolbar` hides the built-in navigation and view buttons |
| Attribute | none | `label` (accessible name), `label-previous`, `label-next`, `label-today`, `label-day`, `label-week`, `label-month`, `label-year`, `label-more` (`+{count} more`), `label-events` (`{count} events`) |
| Property | none | `events` (array, no attribute) |
| Property | none | `range` (read-only `{ start, end }`, `YYYY-MM-DD`, of the period shown) |
| Event data | `{ name, startDate, endDate }` | `{ id?, title, start, end?, color? }`; `start`/`end` take a Date, a timestamp or a date string; a bare `YYYY-MM-DD` is local midnight |
| Event colour | by position in the day, eight fixed hex pastels | `color`: `primary` \| `secondary` \| `error` \| `warning` \| `info` \| `success` \| `neutral`; without it events take palettes in turn by their index in `events` |
| Method | `setEvents(events)` | `el.events = events` |
| Method | `addEvent(event)` | `addEvent(event)` (appends to `events`) |
| Method | `getView()` / `setView(view)` | `view` property |
| Method | `getCurrentDate()` / `setCurrentDate(date)` | `date` property (an ISO string, not a Date) |
| Method | `navigate(-1 \| 1)` | `navigate(-1 \| 1)` |
| Method | none | `today()` |
| Method | none | `focus()` moves focus to the grid's active day |
| Method | `getTimeRange()` / `setTimeRange({ startMin, endMin, startHour, endHour, start, end })` | `startHour` / `endHour` properties |
| Method | `getLocale()` / `setLocale(locale)` | `locale` property |
| Event | none | `punica-select` `{ value, item }`: an event was clicked or activated; `value` is its `id` (its index when it has none), `item` the object given |
| Event | none | `punica-change` `{ view, date }`: the user moved to another period or view (toolbar, keyboard, "+N more", a year day) |
| Slots | none | none |
| CSS parts | none | `base`, `toolbar`, `nav-button`, `today-button`, `title`, `view-button`, `content`, `grid`, `day`, `day-header`, `event`, `more-button`, `icon` |
| CSS custom properties | none (42 hard-coded colours) | `--punica-agenda-background`, `--punica-agenda-muted-background`, `--punica-agenda-border-color`, `--punica-agenda-radius`, `--punica-agenda-today-color`, `--punica-agenda-gutter-width`, `--punica-agenda-day-hour-height`, `--punica-agenda-week-hour-height`, `--punica-agenda-month-cell-height` |
| CSS state | none | `:state(today)` while the period shown contains today |

New behaviour to know about:

- A toolbar (previous, today, next, the period's name, four view buttons) is
  part of the element. Add `no-toolbar` to keep driving it from your own
  controls as in 1.x.
- Every view is a keyboard grid: arrow keys between days, Home/End to the
  ends of the week, PageUp/PageDown to the previous/next period, Enter into a
  day's events (Enter on a year day opens it), arrows between the events,
  Escape back to the day.
- Events are native buttons. An event that spans several days is drawn on
  each of them (1.x drew it on its start day only), and overlapping events
  sit side by side in the week view as well as the day view.
- In the day and week views, an event of whole days (a bare `YYYY-MM-DD`, or
  midnight to midnight) or of 24 hours or more sits in an all-day lane above
  the hours instead of filling its columns. The week's day headers stay in
  view while the hours scroll, and a timed view opens scrolled to its first
  event.
- "+N more" in the month view is a button that opens that day; a day of the
  year view does the same.
- Month and year grids follow the locale's first day of the week, and the
  year view's weekday letters come from `Intl` (1.x hard-coded Turkish
  letters). All text is Gregorian whatever the locale's default calendar.

Removed:

| 1.x | Why |
|---|---|
| `setTimeRange` with minutes or `"HH:MM"`, snapped to 15 minutes | The range is whole hours. A fractional range produced an invalid grid in 1.x (`repeat(8.5, …)`). |
| `getTimeRange().start` / `.end` strings | Read `startHour` / `endHour`. |
| The built-in "more" translations (`en`, `tr`, `de`, `fr`, `es`) | `label-more`. |
| HTML in `name` | Titles are text. 1.x wrote `name` through `innerHTML`. |
| The per-event drop shadow | No token matches it; events are a tint with an accent edge. |

## `punica-virtual-list`

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-virtual-list` | `punica-virtual-list` |
| Base class | `PunicaBase` | `PunicaElement` |
| Attribute | `itemheight` (default 48) | `item-height` (property `itemHeight`, default 48) |
| Attribute | `overscan` (default 6) | `overscan` (default 6) |
| Attribute | none | `label` (accessible name) |
| Property | `items` + `setData(items)` | `items` |
| Property | `renderer(container, item, index)`, which had to append exactly one element, + `setRenderer(fn)` | `renderItem(item, index)` returns a Node (or a string, shown as text); with none set a row shows the item as text |
| Property | `onNearEnd(endIndex)` callback | `punica-near-end` event |
| Property | none | `range` (read-only `{ start, end }` of the rows in view) |
| Method | `setData(items)`, `setRenderer(fn)` | removed: assign the properties |
| Method | none | `scrollToIndex(index, { align })`, `align` = `start` (default) \| `center` \| `end` \| `nearest` |
| Event | none | `punica-range-change` `{ start, end }`: first index in view and the one after the last |
| Event | none | `punica-near-end` `{ end }`: within one screen of the last item; once per `items` value (1.x called `onNearEnd` on every frame near the end) |
| Roles | none | scroller `role="list"`, rows `role="listitem"` with `aria-setsize` / `aria-posinset` |
| Scrolling element | the host | `::part(viewport)` inside the host; it is focusable and scrolls with the keyboard |
| Slots | none | none |
| CSS parts | none | `viewport`, `item` |
| CSS custom properties | `--total-height`, `--row-height` (internal) | `--punica-virtual-list-max-height` (cap for a host with no height, default `100vb`) |

Behaviour changes: rows are kept when their item is the same object, so a
new `items` array re-renders only the rows that changed; a row that holds
focus stays mounted while scrolled out of view; the ResizeObserver exists
only while the element is connected (1.x created one in the constructor and
never disconnected it). A host with no height no longer renders every item:
the scroller is capped at one viewport.

## `punica-virtual-table`

| | 1.x | 2.0 |
|---|---|---|
| Tag | `punica-virtual-table` | `punica-virtual-table` |
| Base class | `PunicaBase` | `PunicaElement` |
| Attribute | `itemheight` (default 48) | `row-height` (property `rowHeight`, default 48) |
| Attribute | `overscan` (default 6) | `overscan` (default 6) |
| Attribute | none | `label` (accessible name) |
| Attribute | none | `selectable`: rows can be picked; the table becomes a `grid` |
| Attribute | none | `row-key`: field that identifies a row (default: its index) |
| Attribute | none | `sort-column`, `sort-direction` (`ascending` \| `descending`): which header shows the sort |
| Header | hard-coded `Name / Company / Title` | `columns`: `{ key, label, width, align, sortable, render? }[]` |
| Property | `items` + `setData(items)` | `rows` (array of objects) |
| Property | `renderer(tbody, item, index)`, which had to append one `<tr>`, + `setRenderer(fn)` | per column: text of `row[key]`, or `column.render(row, index, column)` returning a Node (anything else is shown as text) |
| Property | `onNearEnd(endIndex)` callback | `punica-near-end` event |
| Property | none | `value`: key of the selected row |
| Property | none | `range` (read-only `{ start, end }` of the rows in view) |
| Method | `setData(items)`, `setRenderer(fn)` | removed: assign the properties |
| Method | none | `scrollToIndex(index, { align })` |
| Event | none | `punica-sort` `{ column, direction }`, cancelable: a sortable header was activated. The table shows the direction and never sorts `rows` |
| Event | none | `punica-select` `{ value, item }`: a row was picked (click, Enter, Space) |
| Event | none | `punica-range-change` `{ start, end }`, `punica-near-end` `{ end }` |
| Markup | a real `<table>` with padding rows | `div`s with `table`/`grid`, `rowgroup`, `row`, `columnheader`, `cell`/`gridcell` roles, `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-sort`, `aria-selected` |
| Header | scrolled away with the rows | sticky |
| Attribute on a row | `data-divider` removed from the last `<tr>` | the last row draws no line by itself |
| Slots | none | none |
| CSS parts | none | `viewport`, `header`, `header-cell`, `sort-button`, `body`, `row`, `cell`, `icon` |
| CSS custom properties | `--row-height` (internal) | `--punica-virtual-table-background`, `--punica-virtual-table-header-background`, `--punica-virtual-table-border-color`, `--punica-virtual-table-cell-padding`, `--punica-virtual-table-max-height` |

Keyboard: a plain table's scroller is focusable and scrolls natively. With
`selectable`, one row is the tab stop and Up/Down, Home/End and
PageUp/PageDown move between rows, Enter or Space picks one. The focused row
and the tab stop stay mounted while scrolled out of view.

Removed: the free-form row renderer (a `<tr>` of any shape). A row is now
the declared columns; put custom content in a column's `render`.
