---
'@punica/components': patch
---

The guide says how a script submits right after setting a value (`await control.updateComplete` first: an assignment reaches the form at the end of the microtask), and points hand-drawn forms to `bindForm` of `@punica/form-kit/dom`. A new test suite holds the form controls (`punica-input`, `-textarea`, `-select`, `-checkbox`, `-number-input`, `punica-button`) to what their native counterparts do in a form, side by side: default values, reset, the first enabled option, the empty option, required, custom errors, disabled fieldsets, `form.elements`, Enter, the Tab order and the submitter.
