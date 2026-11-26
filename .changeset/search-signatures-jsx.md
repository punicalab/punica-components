---
'@punica/components': patch
---

The API an assistant reads (`@punica/components/ai`, the MCP server) answers two more questions an assistant searched the type declarations for:
- `search_components` gives the import and typed signature of a function an element's module exports (`confirm(options?: { heading?, message?, … }): Promise<boolean>` beside `punica-alert-dialog`), not only its name; `search()` returns them as `signatures`.
- `get_component` has an "In React (JSX)" section: `import type {} from '@punica/components/react'` types the tags, attribute spellings, and the element's own event written as `on<event>` with its typed `CustomEvent` detail.
The MCP server's version needs a minor bump when this is released.
