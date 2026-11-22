# @punica/components

## 2.1.1

### Patch Changes

- 602f7ef: `toast`, `confirm` and `qrMatrix` are in the type declarations. They were exported and described in the guide, but an `import { toast } from '@punica/components'` did not compile in TypeScript. Imports from `@punica/components/components/*` are typed as well.
  
  The guide says how to find the elements in tests: their roles come from `ElementInternals`, which Playwright's and Testing Library's `getByRole` and some rules of axe-core do not read yet.

## 2.1.0

### Minor Changes

- 96f47d3: Tools for AI assistants and editors: `npx punica-components search|info|guide|validate`, `@punica/components/ai` (the elements' API and a markup validator), `dist/llms.txt` and `dist/llms-full.txt`, an agent skill in `skills/punica-components`, VS Code custom data and JetBrains web-types, and the `@punica/components-mcp` server.

## 2.0.0

A clean break from 1.x: every element was rewritten to one contract
([`docs/contract.md`](docs/contract.md)). Moving a 1.x page over is
[`docs/MIGRATION-2.0.md`](docs/MIGRATION-2.0.md), and
`node scripts/codemod-2.0.mjs <dir>` does the mechanical part.

### Breaking

- Loading: ES modules (`import '@punica/components'` or one element at a
  time) and a global script `dist/punica-components.min.js` (global `Punica`)
  replace `build.min.js`.
- Events are `punica-*`, bubbling and composed; no element fires a synthetic
  native event, and a change made from script fires nothing.
- Booleans follow HTML (`disabled="false"` is disabled), multi-word attributes
  are kebab-case, `startIcon` / `endIcon` slots are `start` / `end`.
- Design tokens are `--punica-*`, built in, with `light-dark()` pairs; the
  host page no longer ships `light.css` / `dark.css`.
- Removed or renamed elements are listed in the migration guide
  (`punica-typography` became `punica-heading` and `punica-text`, for one).

### Added

- 163 elements, among them chat, data table, tree, pickers, navigation,
  command palette and the rest of the families in the docs.
- Every element that takes a value is a real form control (`ElementInternals`:
  `FormData`, reset, validation, `<fieldset disabled>`, labels).
- Keyboard operation by the WAI-ARIA APG patterns, `:state()` and `::part()`
  for restyling, right-to-left through logical properties, overlays in the
  top layer.
- `custom-elements.json`, generated TypeScript types for the elements and for
  React JSX.
