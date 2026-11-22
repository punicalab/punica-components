---
'@punica/components': patch
---

`punica-input` follows a validity that changes while its value does not: a half-typed number or date (`badInput`) reads as an empty value throughout, and the element kept reporting itself valid.
