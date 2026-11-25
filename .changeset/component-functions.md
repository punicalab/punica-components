---
'@punica/components': patch
---

The API an assistant reads (`@punica/components/ai`, `get_component` of the MCP server) shows the functions an element's folder exports, with their import, typed signature and documentation: `confirm()` on `punica-alert-dialog`, `toast()` on `punica-toast` and `punica-toaster`, `qrMatrix()` on `punica-qr-code`. They were only named in the descriptions, so an assistant searched the type declarations for them.
