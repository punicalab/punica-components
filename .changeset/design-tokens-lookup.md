---
'@punica/components': minor
---

The AI tools know the design tokens. `@punica/components/ai` exports `parseTokens` and `formatTokens`. `createValidator(knowledge, { tokens })` warns (`unknown-token`) about a `var(--punica-*)` that names neither a token nor an element's custom property, since the browser only falls back silently. `@punica/components/ai/node` and the CLI check against the package's own tokens. The MCP server gets a `get_tokens` tool (bump @punica/components-mcp minor at version time), and the guide says token names are exact.
