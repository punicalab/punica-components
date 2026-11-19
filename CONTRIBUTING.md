# Contributing

Thank you for helping. Bug reports, fixes, new elements and documentation are
all welcome; for anything larger than a fix, open an issue first so the shape
can be agreed before the work.

## Setup

Node 18 or newer.

```sh
npm ci
npx playwright install chromium   # the tests run in a real browser
npm test
```

| Command | What it does |
|---|---|
| `npm test` | Every test in headless Chromium: the shared contract for each element, behaviour, axe |
| `npm run test:watch` | The same, rerun on save |
| `npx vitest run src/components/<dir>` | One component's tests |
| `npm run audit` | The static gate for the [contract](docs/contract.md); `-- --report` writes `docs/audit.md` |
| `npm run lint` | ESLint |
| `npm run build` | `dist/`, `custom-elements.json` and the types |
| `npm run barrel` | Regenerates `src/index.js` after an element is added or removed |
| `npm run changeset` | Adds a changelog entry for your pull request |

## The contract

Every element follows [`docs/contract.md`](docs/contract.md): how a module is
laid out, its lifecycle, properties and attributes, the event vocabulary,
forms, accessibility, surfaces, styles and tests. Read it before writing an
element; `src/components/button/` (a form control over a native element) and
`src/components/popover/` (a top-layer panel) are the references.

## Adding an element

1. `src/components/<dir>/<name>.js` and `<name>.css`, ending with
   `define('punica-<name>', Punica<Name>)`, with the JSDoc block the contract
   describes (it becomes `custom-elements.json` and the docs' API tables).
2. `src/components/<dir>/<dir>.test.js`: `contract('punica-<name>', { html })`
   from `test/contract.js` for every element in the folder, then its
   behaviour (keyboard, events and their `detail`, form submit and reset for
   a form control).
3. `npm run barrel`, then `npm test`, `npm run audit`, `npm run lint` and
   `npm run build`.

## Pull requests

- Branch from `main`; one change per pull request.
- Add a changeset (`npm run changeset`) unless the change does not reach the
  published package (tests, docs in this repo, tooling).
- Before opening it: `npm test`, `npm run audit`, `npm run lint` and
  `npm run build` all pass.
- A visible change says how it was checked: light and dark, right-to-left,
  keyboard only.

## Documentation site

The documentation and live demos are a separate project,
`punica-components-doc` (served at <https://components.punicalab.com>). It
copies this repo's build in with its `npm run sync:components`, and its API
tables are generated from `custom-elements.json`, so a JSDoc change here is a
docs change there after a sync.

## Releasing

Maintainers only: `npm run version` applies the pending changesets to the
version and `CHANGELOG.md`; after that is merged, `npm run release` builds and
publishes. `prepublishOnly` runs lint, the tests and the build first.

## Conduct and security

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
Report a vulnerability privately as [`SECURITY.md`](SECURITY.md) describes,
never in a public issue.
