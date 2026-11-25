---
'@punica/components': minor
---

The validator reads CSS too (`.css`, `.scss`, `.less`, and `<style>` or strings in other files) and warns of `display: contents` on a part that is, or holds, the native control an element is focused through (`punica-button::part(base)`, `punica-link::part(base)`, `punica-side-nav-item::part(base)`, …): with no box the element takes no focus and leaves the Tab order. The guide says so, says which controls hold `''` and which `null` when empty, and that Playwright's CSS locators reach the native controls inside the elements.
