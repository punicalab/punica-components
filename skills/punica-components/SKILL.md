---
name: punica-components
description: Build UI with @punica/components 2.0, the framework-free punica-* custom elements. Use when writing or changing HTML, JSX or Vue that uses punica-* tags, choosing a punica element, theming with --punica-* tokens, or moving a page from punica 1.x.
---

# @punica/components

Version 2.0 is newer than what you remember and a clean break from 1.x. Do
not write a punica tag, attribute, event, slot or icon name from memory:
look it up, then check the result.

## Work loop

1. **Find the element.** `npx punica-components search "<what you need>"`
   (for example `search "date range"`, `search "side navigation"`).
2. **Read its API before using it.** `npx punica-components info <tag>`:
   attributes with their exact values, properties, events with their
   `detail`, slots, parts, CSS properties. Read every element you use,
   including the children of a family (`punica-tabs`, `punica-tab`,
   `punica-tab-panel`).
3. **See an example** when the layout is not obvious: the element's page at
   https://components.punicalab.com, or its Markdown at
   `https://components.punicalab.com/llms.txt` (an index of every page).
4. **Write the markup**, following the rules from
   `npx punica-components guide`. The ones most often missed:
   - attributes are kebab-case (`full-width`), booleans are present or
     absent (never `="false"`);
   - events are `punica-change`, `punica-input`, `punica-select`,
     `punica-open`, `punica-close`, never `change` or `input`; the value is in
     `event.detail`;
   - React 19 listens with `onpunica-change={…}`; `onChange` never fires;
   - arrays and objects are properties set from script, not attributes;
   - `punica-icon` draws only its built-in glyphs; any other icon is an
     `<svg>` inside it.
5. **Validate before you hand it over.**
   `npx punica-components validate <files or dir>` must report 0 errors.
   Fix each finding (most carry a `[fix: …]`), then run it again.

## Moving from 1.x

`npx punica-components migrate <dir>` lists what changes and `--write`
applies the mechanical renames; the validator then reports what is left.

## Without a shell

If you cannot run commands, read `node_modules/@punica/components/dist/llms.txt`
(rules and every element in a line) and `dist/llms-full.txt` (every element's
whole API), or https://components.punicalab.com/llms.txt.
