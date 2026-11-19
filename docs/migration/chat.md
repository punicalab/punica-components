# Chat, citation and markdown

New in 2.0; there is no 1.x element to migrate from. Eleven elements for an
AI assistant conversation: nine in `src/components/chat/`, `punica-citation`
in `src/components/citation/` and `punica-markdown` in
`src/components/markdown/`.

```html
<punica-chat-layout>
  <h2 slot="header">Assistant</h2>
  <punica-chat-message-list>
    <punica-chat-message sender="user" name="You">
      <punica-chat-message-bubble>How hot does water boil at altitude?</punica-chat-message-bubble>
    </punica-chat-message>
    <punica-chat-message sender="assistant" name="Ivy" status="streaming">
      <punica-chat-tool-calls>
        <punica-chat-tool-call name="web.search" status="success" duration="420">
          <pre slot="input">{ "q": "boiling point altitude" }</pre>
        </punica-chat-tool-call>
      </punica-chat-tool-calls>
      <punica-chat-message-bubble variant="plain">
        <punica-markdown streaming></punica-markdown>
      </punica-chat-message-bubble>
      <punica-chat-message-metadata slot="metadata">
        <time slot="time" datetime="2026-11-18T10:10">10:10</time>
      </punica-chat-message-metadata>
      <button slot="actions" type="button">Copy</button>
    </punica-chat-message>
  </punica-chat-message-list>
  <punica-chat-composer slot="composer" placeholder="Ask anything"></punica-chat-composer>
</punica-chat-layout>
```

Every string a person may read or hear is an attribute with an English
default (`label-*`); set it to translate.

## punica-chat-layout

`chat/chatLayout.js`. The frame: header, scrolling messages, composer. It
follows new content while the reader is at the end and stops when they scroll
up. Give it a block size (it is `block-size: 100%` of its container).

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Accessible name of the scrolling area. Default `Messages`. |
| Attribute | `label-scroll-to-latest` | Accessible name of the jump button. Default `Jump to latest`. |
| Property | `atBottom` | Read-only boolean: the view is following the latest content. |
| Method | `scrollToLatest()` | Scrolls to the end and follows again. |
| Event | `punica-scroll-state` | `{ atBottom }`, when following starts or stops. |
| Slot | (default) | The messages, usually one `punica-chat-message-list`. |
| Slot | `header` | A title bar; its wrapper is hidden while empty. |
| Slot | `composer` | The input area; its wrapper is hidden while empty. |
| Part | `header`, `body`, `scroller`, `content`, `scroll-button`, `composer` | |
| Custom property | `--punica-chat-layout-background` | Default `--punica-color-bg`. |
| Custom property | `--punica-chat-layout-padding` | Default `--punica-space-16`. |
| Custom property | `--punica-chat-layout-max-width` | Width of the message column and the composer. Default `48rem`. |
| State | `:state(at-bottom)` | |

## punica-chat-message-list

`chat/chatMessageList.js`. `role="log"`, `aria-live="polite"`.

| | Name | Notes |
|---|---|---|
| Attribute | `label` | Accessible name of the log. Default `Conversation`. |
| Slot | (default) | The messages. |
| Slot | `empty` | Shown while there is no message. |
| Part | `base`, `empty` | |
| Custom property | `--punica-chat-message-list-gap` | Space between messages. Default `--punica-space-24`. |
| State | `:state(empty)` | |

## punica-chat-message

`chat/chatMessage.js`. One turn; `role="article"`, `aria-busy` while
streaming.

| | Name | Notes |
|---|---|---|
| Attribute | `sender` | `user` \| `assistant` \| `system` \| `tool`. Default `assistant`. A `user` turn sits at the inline end. |
| Attribute | `name` | The sender's display name; shown above the content and used as the accessible name. |
| Attribute | `status` | `streaming` \| `complete` \| `error`. Default `complete`. |
| Attribute | `label` | Accessible name, when `name` is not enough. |
| Attribute | `label-streaming` | Announced while streaming (the dots are what is seen). Default `Writing`. |
| Attribute | `label-error` | Shown beside the error icon. Default `Error`. |
| Slot | (default) | Bubbles, tool calls, markdown. |
| Slot | `avatar` | The sender's picture. |
| Slot | `metadata` | A `punica-chat-message-metadata`. |
| Slot | `actions` | Buttons; faded out until hover or focus inside the message, always in the tab order. |
| Part | `avatar`, `body`, `name`, `content`, `status`, `footer`, `metadata`, `actions` | |
| Custom property | `--punica-chat-message-surface` | Background its bubbles take. Set per sender. |
| Custom property | `--punica-chat-message-on-surface` | Text colour its bubbles take. |
| Custom property | `--punica-chat-message-border` | Border colour its bubbles take; the error colour for `status="error"`. |
| Custom property | `--punica-chat-message-gap` | Space between avatar and body. |
| Custom property | `--punica-chat-message-max-width` | Largest inline size of the body. `80%` for `user`, else `100%`. |
| State | `:state(has-avatar)` | |

## punica-chat-message-bubble

`chat/chatMessageBubble.js`. The content surface. Inside a message it needs no
attribute: its custom properties default to the message's three
`--punica-chat-message-*` colours, which inherit. To restyle every bubble of a
sender, set those on the message; to restyle one bubble, set `variant` or the
bubble's own properties.

| | Name | Notes |
|---|---|---|
| Attribute | `variant` | `filled` (default: the sender's surface) \| `outlined` (border, no fill) \| `plain` (no surface, no padding). |
| Slot | (default) | The content. |
| Part | `base` | |
| Custom property | `--punica-chat-message-bubble-background` | Default: the message's surface, else `--punica-color-surface`. |
| Custom property | `--punica-chat-message-bubble-color` | Default: the message's on-surface colour, else `--punica-color-text`. |
| Custom property | `--punica-chat-message-bubble-border-color` | Default: the message's border, else `--punica-color-border`. |
| Custom property | `--punica-chat-message-bubble-radius` | Default `--punica-radius-lg`. |
| Custom property | `--punica-chat-message-bubble-padding` | |

## punica-chat-message-metadata

`chat/chatMessageMetadata.js`. A small muted row.

| | Name | Notes |
|---|---|---|
| Slot | `time` | When the turn was sent; a `<time>`. |
| Slot | `model` | The model's name. |
| Slot | `tokens` | Token counts. |
| Slot | (default) | Anything else. |
| Part | `base` | |
| Custom property | `--punica-chat-message-metadata-color` | |
| Custom property | `--punica-chat-message-metadata-gap` | |

## punica-chat-system-message

`chat/chatSystemMessage.js`. A centred notice between turns; `role="note"`.

| | Name | Notes |
|---|---|---|
| Attribute | `color` | `primary` \| `secondary` \| `error` \| `warning` \| `info` \| `success` \| `neutral`. Default `neutral`. |
| Slot | (default) | The notice. |
| Slot | `icon` | A glyph before the notice. |
| Part | `base`, `label` | |
| Custom property | `--punica-chat-system-message-color` | |
| Custom property | `--punica-chat-system-message-background` | |
| Custom property | `--punica-chat-system-message-line-color` | The rule on each side. |

## punica-chat-composer

`chat/chatComposer.js`. Form-associated message input over a native
`<textarea>` that grows with its text (`field-sizing: content`, measured in
script where that is missing).

Enter sends, Shift+Enter starts a new line, and Enter that confirms an IME
composition is left alone. Sending fires `punica-submit`; unless it is
prevented, the owning form (if there is one) is asked to submit with the text
in its data, and the field is cleared. While `busy`, Enter sends nothing and
the button stops.

| | Name | Notes |
|---|---|---|
| Attribute | `value` | The default text. The `value` property is the current text and is not reflected. |
| Attribute | `placeholder` | |
| Attribute | `label` | Accessible name of the field. Default `Message`. |
| Attribute | `name` | Name the text is submitted under. |
| Attribute | `disabled` | Also disabled by a `<fieldset disabled>`. |
| Attribute | `required` | `valueMissing` while empty. |
| Attribute | `busy` | A response is streaming: the send button is a stop button. |
| Attribute | `max-rows` | Lines the field grows to before it scrolls. Default `8`. |
| Attribute | `label-send` | Default `Send`. |
| Attribute | `label-stop` | Default `Stop`. |
| Method | `focus(options?)` | Focuses the text area. |
| Method | `checkValidity()`, `reportValidity()`, `setCustomValidity(message)` | From `FormControl`. |
| Event | `punica-input` | `{ value }`, while typing. |
| Event | `punica-submit` | `{ value }`, cancelable. Prevent it to keep the text and not submit the form. |
| Event | `punica-stop` | `{}`, the stop button was pressed while `busy`. |
| Event | `punica-attach` | `{ files: File[] }`, files were pasted or dropped. Nothing is uploaded. |
| Slot | `start` | Controls before the field: attach buttons. |
| Slot | `end` | Controls between the field and the send button. |
| Slot | `footer` | A line under the field. |
| Part | `base`, `field`, `textarea`, `send-button`, `footer` | |
| Custom property | `--punica-chat-composer-background` | |
| Custom property | `--punica-chat-composer-border-color` | |
| Custom property | `--punica-chat-composer-radius` | |
| Custom property | `--punica-chat-composer-padding` | |
| State | `:state(busy)`, `:state(empty)`, `:state(dragover)`, `:state(disabled)`, `:state(invalid)`, `:state(valid)` | |

The send button is disabled while the field is empty or holds only white
space.

## punica-chat-tool-calls

`chat/chatToolCalls.js`. The tools a turn called, folded under one native
button.

| | Name | Notes |
|---|---|---|
| Attribute | `open` | The list is showing. Collapsed by default. |
| Attribute | `label` | Text of the header. Default `Tool calls`. |
| Event | `punica-toggle` | `{ open }`, when a person folds or unfolds it. |
| Slot | (default) | `punica-chat-tool-call` items; their count is shown in the header. |
| Part | `header`, `label`, `count`, `panel` | |
| Custom property | `--punica-chat-tool-calls-gap` | |
| Custom property | `--punica-chat-tool-calls-color` | Colour of the header. |

## punica-chat-tool-call

`chat/chatToolCall.js`. One invocation: a disclosure (native button,
`aria-expanded`) over its input and output. Status is an icon and a word.

| | Name | Notes |
|---|---|---|
| Attribute | `name` | The tool's name. |
| Attribute | `status` | `pending` \| `running` \| `success` \| `error`. Default `pending`. |
| Attribute | `duration` | Milliseconds; shown through `Intl.NumberFormat` in the element's language (`420ms`, `1.5s`). |
| Attribute | `open` | Input and output are showing. |
| Attribute | `label-pending`, `label-running`, `label-success`, `label-error` | Status words. Defaults `Pending`, `Running`, `Done`, `Failed`. |
| Attribute | `label-input`, `label-output` | Section headings. Defaults `Input`, `Output`. |
| Event | `punica-toggle` | `{ open }`. |
| Slot | `input` | What the tool was called with: a `punica-code-block` or a `<pre>`. Its section is hidden while empty. |
| Slot | `output` | What it returned. Its section is hidden while empty. |
| Slot | (default) | Anything else shown when open. |
| Part | `base`, `header`, `name`, `status`, `status-text`, `duration`, `panel`, `section`, `section-label` | |
| Custom property | `--punica-chat-tool-call-background` | |
| Custom property | `--punica-chat-tool-call-border-color` | |
| Custom property | `--punica-chat-tool-call-radius` | |

## punica-citation

`citation/citation.js`. An inline numbered source marker. With an `href` it is
a native link; with none, or with one that is not `http:`, `https:`,
`mailto:` or relative, it is a native button that toggles the card. The card
is a composed `punica-popover`; it opens on hover and on focus, focus stays on
the marker, and Escape closes it.

| | Name | Notes |
|---|---|---|
| Attribute | `index` | The number shown. |
| Attribute | `href` | The source's address. An external one gets `rel="noopener noreferrer"`. |
| Attribute | `heading` | The source's title, shown in the card. (Not the global `title`, which would also show the browser's tooltip.) |
| Attribute | `source` | The site or publication, shown in the card. |
| Attribute | `target` | As on `<a>`. |
| Attribute | `open` | The card is showing. |
| Attribute | `label` | The whole accessible name of the marker. |
| Attribute | `label-citation` | The word before the number in the default name (`Source 1: Title`). Default `Source`. |
| Method | `show()`, `hide()` | Open and close the card. |
| Event | `punica-open` | The card opened. |
| Event | `punica-close` | `{ reason }`: `escape`, `outside` or `api`. |
| Slot | (default), `snippet` | A snippet of the source, shown in the card. |
| Part | `marker`, `index`, `popover`, `card`, `title`, `source`, `snippet` | |
| Custom property | `--punica-citation-color` | |
| Custom property | `--punica-citation-background` | |
| Custom property | `--punica-citation-radius` | |
| Custom property | `--punica-citation-card-width` | Largest inline size of the card. Default `20rem`. |

## punica-markdown

`markdown/markdown.js`, with its parser in `markdown/parser.js` and its URL
filter in `markdown/url.js`. No dependency.

```js
const md = document.querySelector('punica-markdown');
md.renderCodeBlock = (code, language) => {
  const block = document.createElement('punica-code-block');
  block.language = language;
  block.code = code;
  return block;
};
md.streaming = true;
for await (const chunk of stream) md.value = (md.value ?? '') + chunk;
md.streaming = false;
```

| | Name | Notes |
|---|---|---|
| Attribute | `value` | The Markdown source; not reflected. While unset, the element's own text content is the source (dedented, and watched for changes). |
| Attribute | `streaming` | The source is still growing: `aria-busy`, and a caret after the last block. |
| Attribute | `no-images` | Images render as links, so nothing is fetched until a person asks. |
| Property | `renderCodeBlock` | `(code, language) => Node \| null`. Called for every code block; a returned node is used as the block, `null` gives the built-in `<pre><code class="language-…">`. |
| Part | `base`, `heading`, `paragraph`, `link`, `image`, `inline-code`, `code-block`, `code`, `blockquote`, `list`, `list-item`, `checkbox`, `table-wrap`, `table`, `hr` | |
| Custom property | `--punica-markdown-gap` | Space between blocks. |
| Custom property | `--punica-markdown-link-color` | |
| Custom property | `--punica-markdown-code-background` | |
| Custom property | `--punica-markdown-code-font-family` | |
| Custom property | `--punica-markdown-border-color` | Table lines, rules, the quote bar. |
| State | `:state(streaming)` | |

It fires no events and has no slots: the light DOM is read, never shown.

**What it renders.** ATX headings, paragraphs, emphasis, strong,
strikethrough (`~~`), inline code, fenced code (backticks or tildes) and
indented code, block quotes, bullet, ordered and nested lists, task lists
(disabled checkboxes named after their item), links, `<…>` and bare
`http(s)://` autolinks, images, GFM tables with column alignment, thematic
breaks, hard line breaks (two trailing spaces or a backslash), backslash
escapes and character references. Not supported: setext headings (`===`
underlines), reference-style links, footnotes.

**What it refuses.** The tree is built with `createElement` and `textContent`
only. Raw HTML in the source is shown as the text that was written. A link or
image is made only for an `http:`, `https:`, `mailto:` or relative URL; for
anything else (`javascript:`, `data:`, `vbscript:`, `file:` …, however the
scheme is disguised) the Markdown that was written is shown as text. An
external link gets `target="_blank" rel="noopener noreferrer"`. An image with
no alt text is not shown.

**Streaming.** Every change to `value` is applied as a patch: a block whose
source text did not change keeps its DOM node, a list or quote that only grew
keeps the items it had, and a built-in code block that grew keeps its
`<code>` and only takes new text. So finished blocks do not flicker and a
selection inside them survives. Only the last block, the one still being
written, is rebuilt. A node returned by `renderCodeBlock` is replaced each
time its code grows.
