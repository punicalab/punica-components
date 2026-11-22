---
'@punica/components': patch
---

`toast`, `confirm` and `qrMatrix` are in the type declarations. They were exported and described in the guide, but an `import { toast } from '@punica/components'` did not compile in TypeScript. Imports from `@punica/components/components/*` are typed as well.

The guide says how to find the elements in tests: their roles come from `ElementInternals`, which Playwright's and Testing Library's `getByRole` and some rules of axe-core do not read yet.
