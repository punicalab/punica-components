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

## Tools for AI assistants

`src/ai/` reads `custom-elements.json`: `knowledge.mjs` answers what an
element takes and `validate.mjs` checks markup against it. The CLI
(`bin/`), `dist/llms*.txt` (`scripts/llms.mjs`), the agent skill
(`skills/`) and the MCP server (`packages/mcp`, its own package with its own
`npm install`: `npm run build:mcp`, `npm run test:mcp`) are built on them, so a
component's JSDoc is what assistants are told about it. The usage rules
they all share are `src/ai/guide.md`.

`npm run eval` measures whether that helps: it asks models to build twelve
pages with no context, with `llms.txt`, and with the tools, and scores each
answer by the validator, a render and axe. It needs an Anthropic API key and
prints its cost before anything is called.

## Documentation site

The documentation and live demos are a separate project,
`punica-components-doc` (served at <https://components.punicalab.com>). It
copies this repo's build in with its `npm run sync:components`, and its API
tables are generated from `custom-elements.json`, so a JSDoc change here is a
docs change there after a sync.

## Releasing

Maintainers only. Releases go out from `main`, by
`.github/workflows/release.yml`:

1. On `develop`, `npm run version` applies the pending changesets to the
   version and `CHANGELOG.md`. Commit that.
2. For the MCP server, raise `version` in `packages/mcp/package.json` by hand
   when it changed.
3. Open a pull request from `develop` to `main` and merge it.

On the push to `main` the workflow installs, runs lint, the audit, the tests
and both builds, and then publishes each package whose version is not on npm
yet, with provenance, and tags it. A merge that changes no version publishes
nothing; pending changesets on `main` fail the run. It signs in with the
repository secret `NPM_TOKEN`, an npm granular token with publish rights on
the `@punica` scope; npm caps such tokens at 90 days, so renew it before it
lapses.

## Conduct and security

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
Report a vulnerability privately as [`SECURITY.md`](SECURITY.md) describes,
never in a public issue.
