---
'@punica/components': minor
---

The tokens ship as Design Tokens (the W3C Design Tokens Community Group format, 2025.10) for design tools and token pipelines: `@punica/components/tokens/light.tokens.json` and `dark.tokens.json`, one per colour scheme, generated from `tokens.css` at build. The `light-dark()` pairs are split into the two files; everything else is the same in both. Each token names its CSS custom property in `$extensions["com.punicalab.css"]`; the focus ring is a `border` token that refers to its width and colour.
