---
'@punica/components': patch
---

A custom error (`setCustomValidity`) on a form control is added to what is wrong with its value (`badInput`, `valueMissing`, …) instead of replacing it, as on a native control: `validity.badInput` stayed false while a message was set.
