# @punica/components-mcp

An [MCP](https://modelcontextprotocol.io) server that lets an AI assistant
use [@punica/components](https://components.punicalab.com) correctly: find an
element, read its exact API and examples, and check the markup it wrote.

Version 2.0 of the library is newer than most models' training data, so
without it a model guesses tags, attributes and events. With it, the model
looks them up and validates its answer.

## Tools

| Tool | What it does |
|---|---|
| `search_components` | Finds elements by what they are for: "date range", "side navigation", "confirm dialog" |
| `get_component` | One or more elements' whole API: attributes and their values, properties, methods, events, slots, parts, CSS properties, states |
| `get_examples` | An element's documentation page as Markdown, with working HTML examples (fetched from the docs site) |
| `validate_markup` | Checks HTML, JSX, Vue or script: unknown tags and 1.x names, attributes, values, slots, events, icon names; each problem with a fix |
| `get_guide` | The rules every element follows, or a guide page (theme, forms, frameworks, migration, accessibility, …) |

Resources: `punica://guide` and `punica://component/<tag>`.

The server answers for the `@punica/components` installed in the project it
is started in; without one, for the version it was built with.

## Set up

**Claude Code**

```sh
claude mcp add punica -- npx -y @punica/components-mcp
```

**Cursor** (`.cursor/mcp.json`), **VS Code** (`.vscode/mcp.json`, key `servers`), **Claude Desktop** and others:

```json
{
  "mcpServers": {
    "punica": { "command": "npx", "args": ["-y", "@punica/components-mcp"] }
  }
}
```

## Without MCP

The library itself ships the same knowledge:
`npx punica-components search|info|validate`, an agent skill in
`node_modules/@punica/components/skills/punica-components/`, and
`dist/llms.txt` / `dist/llms-full.txt`.
