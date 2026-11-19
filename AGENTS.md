# Working on punica-components

This file is for agents changing this repository. If you are *using* the
library in an app, read `skills/punica-components/SKILL.md` instead.

- The rules every element follows: [`docs/contract.md`](docs/contract.md).
- Setup, commands, adding an element, changesets: [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Before you finish: `npm test`, `npm run audit`, `npm run lint`, `npm run build`.
- `src/ai/` (the API lookup and validator behind the CLI, the MCP server and
  `dist/llms*.txt`) reads `custom-elements.json`, so the JSDoc on a component
  is what tools and models are told about it: keep it exact.
