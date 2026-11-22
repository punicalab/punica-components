---
'@punica/components': minor
---

`punica-field` describes its control to assistive technology: its help and the error it shows become the control's `description` (new on `punica-input`, `-textarea`, `-select` and `-checkbox`, read as `aria-description` on the inner control) or `aria-description` on a native control, unless the control has its own. Those four controls set `aria-invalid` on their inner control once touched and invalid for any reason, an error set with `setCustomValidity` included (`punica-select` said it only for a missing value). `punica-select` and `punica-checkbox` count as touched when reported invalid (a submit, `checkValidity()`, `reportValidity()`), as the text controls already did.
