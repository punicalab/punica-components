# @punica/components

[![npm](https://img.shields.io/npm/v/@punica/components)](https://www.npmjs.com/package/@punica/components)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-components.punicalab.com-0b57d0)](https://components.punicalab.com)

Framework-free custom elements on platform standards: 163 `punica-*`
elements over one small base class, no runtime dependency.

**Documentation and live demos: <https://components.punicalab.com>**

```html
<script type="module">
  import '@punica/components';
</script>

<punica-button>Save</punica-button>
```

## Install

```sh
npm i @punica/components
```

Then one of:

```js
import '@punica/components';                                  // every element
import '@punica/components/components/button/button.js';      // one element
```

or without a build step, from a CDN, as a classic script (global `Punica`):

```html
<script src="https://cdn.jsdelivr.net/npm/@punica/components@2/dist/punica-components.min.js"></script>
```

## What every element does

- A real form control where a value is entered (`ElementInternals`:
  `FormData`, reset, validation, `<fieldset disabled>`, labels).
- Keyboard operation by the WAI-ARIA APG pattern, visible focus, roles and
  state for assistive technology.
- Overlays in the top layer (Popover API, `<dialog>`), anchored with CSS
  anchor positioning where the browser has it and measured elsewhere.
- Styles in shared constructable stylesheets; `::part()` and `:state()` for
  restyling; logical properties, so right-to-left works; reduced motion and
  forced colours respected.
- Events named `punica-*`, bubbling and composed.
- No attribute or data value is ever parsed as HTML.

## Theming

Tokens are `--punica-*` custom properties, built in and overridable:

```css
:root {
  color-scheme: light dark; /* or `dark` on any subtree */
  --punica-color-primary: light-dark(#0b57d0, #a8c7fa);
  --punica-radius: 4px;
}
```

The full list is `src/tokens/tokens.css`, also shipped as
`@punica/components/tokens.css`.

## Frameworks

They are plain custom elements, so they work in any framework. React 19 sets
properties and listens to `punica-*` events directly; React 18, Vue and
Angular need a property binding or a listener for the custom events. The
details and examples are on the
[frameworks page](https://components.punicalab.com/docs/frameworks).

## Server-side rendering (experimental)

`@punica/components/ssr` writes each element's shadow root into the HTML as
Declarative Shadow DOM, so a server-rendered page shows the elements styled
before the script arrives (or without it), and nothing moves when they
upgrade. It runs in Node, in a worker with
[happy-dom](https://github.com/capricorn86/happy-dom), which you install
beside it:

```js
import { createRenderer } from '@punica/components/ssr';

const renderer = await createRenderer(); // once, for the life of the server
const html = await renderer.render('<punica-field label="Name"><punica-input name="name"></punica-input></punica-field>');
```

- Load `@punica/components/tokens.css` in the page's `<head>`: the rendered
  styles read the `--punica-*` tokens before the script installs them.
- The script, loaded as usual, takes the elements over. What the user typed
  or checked before it came is kept.
- Starting a renderer takes a few hundred milliseconds; each `render`, a few.
  `renderToString(html)` starts and closes one for a single call.

## Types and editors

`custom-elements.json` describes every element (attributes, properties,
events, slots, parts, custom properties). `@punica/components` types the
elements and `HTMLElementTagNameMap`; `@punica/components/react` types JSX.

Editor completion for tags, attributes and their values:

- **VS Code**: in `.vscode/settings.json`,
  `"html.customData": ["./node_modules/@punica/components/dist/vscode.html-custom-data.json"]`
  and `"css.customData": ["./node_modules/@punica/components/dist/vscode.css-custom-data.json"]`.
- **WebStorm and other JetBrains IDEs** read `dist/web-types.json` by
  themselves (the package's `web-types` field).

## Using with AI tools

2.0 is newer than most models' training data, so an assistant left alone
guesses tags, attributes and events. Give it the library's own knowledge:

- **CLI.** `npx punica-components search "date range"`, `info punica-select`,
  `guide`, and `validate <files>`, which checks tags, attributes, values,
  slots, events and icon names and exits 1 on an error.
- **Agent skill.** Copy `node_modules/@punica/components/skills/punica-components`
  into `.claude/skills/` (or `~/.claude/skills/`): the assistant then looks
  each element up and validates before it hands markup over.
- **MCP server.** [`@punica/components-mcp`](packages/mcp): `claude mcp add punica -- npx -y @punica/components-mcp`,
  or the same command in Cursor, VS Code or any MCP client.
- **llms.txt.** `dist/llms.txt` (the rules and every element in a line) and
  `dist/llms-full.txt` (every element's whole API) in the package;
  <https://components.punicalab.com/llms.txt> indexes every documentation
  page as Markdown.
- **In code.** `import { knowledge, validate } from '@punica/components/ai/node'`.

## An application

[punica-starter](https://github.com/punicalab/punica-starter) is a small
application on this library together with Punica Form and Punica Request: sign in, a list, and a form
that is created and edited, with its tests. Start one of your own from it:

```bash
npm create punica@latest my-app
```

## Browser support

The current versions of Chrome, Edge, Firefox and Safari: the elements need
the Popover API, form-associated custom elements, CSS custom states
(`:state()`), `light-dark()` and `AbortSignal.any`, which together are
Chrome and Edge 125, Firefox 126 and Safari 17.5 or newer. CSS anchor
positioning is used where present and replaced by measurement elsewhere. The
test suite runs in Chromium.

## Coming from 1.x

2.0 is a clean break. [`docs/MIGRATION-2.0.md`](docs/MIGRATION-2.0.md) maps
every tag, attribute, event and token, and `node scripts/codemod-2.0.mjs <dir>`
rewrites what can be rewritten and lists the rest.

## Working on it

| Command | What it does |
|---|---|
| `npm test` | 2,700+ tests in Chromium: the shared contract for every element, behaviour, axe |
| `npm run audit` | The static gate for the [contract](docs/contract.md) |
| `npm run build` | `dist/` (ES modules, global script, `tokens.css`), `custom-elements.json`, types |
| `npm run lint` | ESLint |

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, adding an element and
changesets. Everyone taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md); report a vulnerability as
[`SECURITY.md`](SECURITY.md) says.

## License

[MIT](LICENSE) © PunicaLab
