---
'@punica/components': patch
---

The global script (`dist/punica-components.min.js`, the CDN build) parses on a page that names no charset. A regex in `punica-outline` held combining marks as raw characters; a page without `<meta charset>`, served without a charset, read them as windows-1252 and the whole script failed (`Private field '#z' must be declared in an enclosing class`). The build now stops when the global script has a non-ASCII byte.
