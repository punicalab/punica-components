---
'@punica/components': minor
---

Every event that documents its `detail` now has it typed: 129 of the 162 events, written as `@fires {{ value: string }} punica-change - ...` on the element. The event maps in `index.d.ts` and the `onpunica-*` props in `react.d.ts` take it (`CustomEvent<{ value: string | string[] | null }>` instead of `CustomEvent<any>`), and `get_component` of the MCP server shows it in a Detail column. Close reasons of the dialogs and drawers list their values and still take any string, since `requestClose(reason)` names its own. The 33 events that carry no detail stay `any`.

`confirm()`, `toast()` and `qrMatrix()` are now declared at the top of `index.d.ts` as `export declare function`, where a look at the file finds them; they were declared at its end.
