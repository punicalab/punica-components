import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import { parseMarkdown } from './parser.js';
import { safeUrl } from './url.js';
import './markdown.js';

const sample = [
  '## Plan',
  '',
  'Read the **contract**, then write `code` and [the docs](https://example.com/docs).',
  '',
  '- [x] parser',
  '- [ ] tests',
  '',
  '1. one',
  '2. two',
  '',
  '> quoted',
  '',
  '```js',
  'const a = 1;',
  '```',
  '',
  '| Name | Count |',
  '| :--- | ----: |',
  '| a    | 1     |',
  '',
  '---',
  '',
  '![A diagram](https://example.com/d.png)'
].join('\n');

contract('punica-markdown', { html: '<punica-markdown></punica-markdown>' });

describe('punica-markdown: contract with content', () => {
  afterEach(cleanup);

  it('has no axe violations with every construct rendered', async () => {
    const { a11y } = await import('../../../test/contract.js');
    const el = await fixture('<punica-markdown></punica-markdown>');
    el.value = sample;
    await settle();
    expect(el.shadowRoot.querySelector('table')).toBeTruthy();
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('does not grow its shadow tree when moved', async () => {
    const el = await fixture('<punica-markdown></punica-markdown>');
    el.value = sample;
    await settle();
    const count = el.shadowRoot.querySelectorAll('*').length;
    const first = el.shadowRoot.querySelector('h2');
    const parent = el.parentElement;
    el.remove();
    parent.appendChild(el);
    await settle();
    expect(el.shadowRoot.querySelectorAll('*').length).toBe(count);
    expect(el.shadowRoot.querySelector('h2')).toBe(first);
  });
});

/** Renders `source` and returns the container of the rendered blocks. */
async function render(source, attributes = '') {
  const el = await fixture(`<punica-markdown ${attributes}></punica-markdown>`);
  el.value = source;
  await settle();
  return el.shadowRoot.querySelector('[part="base"]');
}

/** A compact, attribute-free picture of the tree: `p(em("a")," b")`. */
function shape(node) {
  if (node.nodeType === 3) return JSON.stringify(node.data);
  const children = [...node.childNodes].map(shape).join(',');
  return `${node.localName}(${children})`;
}
const shapes = (base) => [...base.childNodes].map(shape).join(' ');

describe('punica-markdown: constructs', () => {
  afterEach(cleanup);

  it.each([
    ['heading 1', '# Title', 'h1("Title")'],
    ['heading 3 with closing hashes', '### Title ###', 'h3("Title")'],
    ['heading 6', '###### Deep', 'h6("Deep")'],
    ['seven hashes are text', '####### no', 'p("####### no")'],
    ['a hash with no space is text', '#no', 'p("#no")'],
    ['paragraph', 'one\ntwo', 'p("one\\ntwo")'],
    ['two paragraphs', 'one\n\ntwo', 'p("one") p("two")'],
    ['emphasis with stars', 'an *em* word', 'p("an ",em("em")," word")'],
    ['emphasis with underscores', 'an _em_ word', 'p("an ",em("em")," word")'],
    ['strong with stars', 'a **strong** word', 'p("a ",strong("strong")," word")'],
    ['strong with underscores', 'a __strong__ word', 'p("a ",strong("strong")," word")'],
    ['strikethrough', 'a ~~gone~~ word', 'p("a ",del("gone")," word")'],
    ['a single tilde is text', 'about ~5 and ~10', 'p("about ~5 and ~10")'],
    ['inline code', 'run `npm test` now', 'p("run ",code("npm test")," now")'],
    ['inline code keeps markup as text', '`**not bold**`', 'p(code("**not bold**"))'],
    ['inline code with a backtick inside', '`` a ` b ``', 'p(code("a ` b"))'],
    ['an unclosed backtick is text', 'a ` b', 'p("a ` b")'],
    ['hard break by two spaces', 'one  \ntwo', 'p("one",br(),"two")'],
    ['hard break by backslash', 'one\\\ntwo', 'p("one",br(),"two")'],
    ['a soft break is not a break', 'one \ntwo', 'p("one\\ntwo")'],
    ['backslash escapes', '\\*not em\\* \\# \\[x\\]', 'p("*not em* # [x]")'],
    ['horizontal rule by dashes', 'a\n\n---\n\nb', 'p("a") hr() p("b")'],
    ['horizontal rule by stars', '* * *', 'hr()'],
    ['horizontal rule by underscores', '___', 'hr()'],
    ['block quote', '> quoted\n> text', 'blockquote(p("quoted\\ntext"))'],
    ['block quote with a lazy line', '> quoted\ntext', 'blockquote(p("quoted\\ntext"))'],
    ['nested block quote', '> a\n> > b', 'blockquote(p("a"),blockquote(p("b")))'],
    ['block quote holding a list', '> - a\n> - b', 'blockquote(ul(li(p("a")),li(p("b"))))'],
    ['unordered list', '- a\n- b', 'ul(li(p("a")),li(p("b")))'],
    ['unordered list with stars and pluses', '* a\n* b\n\n+ c', 'ul(li(p("a")),li(p("b"))) ul(li(p("c")))'],
    ['ordered list', '1. a\n2. b', 'ol(li(p("a")),li(p("b")))'],
    ['ordered list with parentheses', '1) a\n2) b', 'ol(li(p("a")),li(p("b")))'],
    ['nested list', '- a\n  - b\n  - c\n- d', 'ul(li(p("a"),ul(li(p("b")),li(p("c")))),li(p("d")))'],
    ['ordered inside unordered', '- a\n  1. b\n  2. c', 'ul(li(p("a"),ol(li(p("b")),li(p("c")))))'],
    ['three levels', '- a\n  - b\n    - c', 'ul(li(p("a"),ul(li(p("b"),ul(li(p("c")))))))'],
    ['list item with two paragraphs', '- a\n\n  b\n- c', 'ul(li(p("a"),p("b")),li(p("c")))'],
    ['list item holding code', '- a\n\n  ```\n  x\n  ```', 'ul(li(p("a"),pre(code("x"))))'],
    ['a list ends a paragraph', 'text\n- a', 'p("text") ul(li(p("a")))'],
    ['fenced code', '```\nplain <b>\n```', 'pre(code("plain <b>"))'],
    ['fenced code with tildes', '~~~\n```\n~~~', 'pre(code("```"))'],
    ['fenced code keeps blank lines and markup', '```\n# a\n\n*b*\n```', 'pre(code("# a\\n\\n*b*"))'],
    ['unclosed fence runs to the end', '```\nhalf', 'pre(code("half"))'],
    ['indented code', 'a\n\n    code\n    more', 'p("a") pre(code("code\\nmore"))'],
    ['link', '[text](https://example.com)', 'p(a("text"))'],
    ['link with markup inside', '[**b** `c`](/path)', 'p(a(strong("b")," ",code("c")))'],
    ['link with parentheses in the address', '[w](https://en.wikipedia.org/wiki/A_(b))', 'p(a("w"))'],
    ['angle autolink', '<https://example.com/a>', 'p(a("https://example.com/a"))'],
    ['bare autolink', 'see https://example.com/a. Then', 'p("see ",a("https://example.com/a"),". Then")'],
    ['brackets without an address are text', '[not a link] and [x]', 'p("[not a link] and [x]")'],
    ['image', '![alt text](https://example.com/a.png)', 'p(img())'],
    ['image inside a link', '[![alt](/a.png)](/b)', 'p(a(img()))'],
    ['table', '| a | b |\n|---|---|\n| 1 | 2 |', 'div(table(thead(tr(th("a"),th("b"))),tbody(tr(td("1"),td("2")))))'],
    ['table without outer pipes', 'a | b\n--|--\n1 | 2', 'div(table(thead(tr(th("a"),th("b"))),tbody(tr(td("1"),td("2")))))'],
    ['table after a paragraph', 'intro\n| a | b |\n|---|---|\n| 1 | 2 |', 'p("intro") div(table(thead(tr(th("a"),th("b"))),tbody(tr(td("1"),td("2")))))'],
    ['table cells take inline markup and escaped pipes', '| a |\n|---|\n| *x* \\| `y` |', 'div(table(thead(tr(th("a"))),tbody(tr(td(em("x")," | ",code("y"))))))'],
    ['a short row is padded, a long one cut', '| a | b |\n|---|---|\n| 1 |\n| 1 | 2 | 3 |', 'div(table(thead(tr(th("a"),th("b"))),tbody(tr(td("1"),td()),tr(td("1"),td("2")))))'],
    ['a header with the wrong column count is text', '| a | b |\n|---|\n| 1 |', 'p("| a | b |\\n|---|\\n| 1 |")']
  ])('%s', async (_name, source, expected) => {
    expect(shapes(await render(source))).toBe(expected);
  });

  it('scrolls a long code line inside its block instead of widening a container that shrink-wraps it', async () => {
    const box = await fixture('<div style="display:flex;flex-direction:column;align-items:flex-start;inline-size:300px"><punica-markdown></punica-markdown></div>');
    const md = box.querySelector('punica-markdown');
    md.value = 'A short line.\n\n~~~\n' + 'x'.repeat(300) + '\n~~~';
    await settle();
    expect(md.getBoundingClientRect().width).toBeLessThanOrEqual(300);
    const pre = md.shadowRoot.querySelector('pre');
    expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);
  });

  it('keeps a code block left to right in a right-to-left page', async () => {
    const box = await fixture('<div dir="rtl"><punica-markdown></punica-markdown></div>');
    const md = box.querySelector('punica-markdown');
    md.value = '~~~js\nconst a = 1;\n~~~';
    await settle();
    expect(getComputedStyle(md.shadowRoot.querySelector('pre')).direction).toBe('ltr');
  });

  it('gives a fenced code block its language class', async () => {
    const base = await render('```js\nconst a = 1;\n```\n\n```c++ title="x"\nint a;\n```\n\n```\nplain\n```');
    const [js, cpp, plain] = base.querySelectorAll('pre > code');
    expect(js.className).toBe('language-js');
    expect(js.textContent).toBe('const a = 1;');
    expect(cpp.className).toBe('language-c++');
    expect(plain.className).toBe('');
  });

  it('hands fenced code to renderCodeBlock and uses the node it returns', async () => {
    const el = await fixture('<punica-markdown></punica-markdown>');
    const calls = [];
    el.renderCodeBlock = (code, language) => {
      calls.push([code, language]);
      if (language !== 'js') return null;
      const block = document.createElement('figure');
      block.textContent = code;
      return block;
    };
    el.value = '```js\nlet a;\n```\n\n```py\nb = 1\n```';
    await settle();
    const base = el.shadowRoot.querySelector('[part="base"]');
    expect(calls).toEqual([
      ['let a;', 'js'],
      ['b = 1', 'py']
    ]);
    expect(shapes(base)).toBe('figure("let a;") pre(code("b = 1"))');
    el.renderCodeBlock = null;
    await settle();
    expect(shapes(base)).toBe('pre(code("let a;")) pre(code("b = 1"))');
  });

  it('renders task items as disabled checkboxes with a name', async () => {
    const base = await render('- [x] done\n- [ ] open\n- plain');
    const items = [...base.querySelectorAll('li')];
    const boxes = items.map((li) => li.querySelector('input'));
    expect(boxes[0].type).toBe('checkbox');
    expect(boxes[0].disabled).toBe(true);
    expect(boxes[0].checked).toBe(true);
    expect(boxes[0].getAttribute('aria-label')).toBe('done');
    expect(boxes[1].checked).toBe(false);
    expect(boxes[1].disabled).toBe(true);
    expect(boxes[2]).toBe(null);
    expect(items.map((li) => li.textContent)).toEqual(['done', 'open', 'plain']);
  });

  it('starts an ordered list where the source starts it', async () => {
    const base = await render('3. c\n4. d');
    expect(base.querySelector('ol').getAttribute('start')).toBe('3');
    expect((await render('1. a')).querySelector('ol').hasAttribute('start')).toBe(false);
  });

  it('marks tight and loose lists', async () => {
    expect((await render('- a\n- b')).querySelector('ul').className).toBe('tight');
    expect((await render('- a\n\n- b')).querySelector('ul').className).toBe('loose');
  });

  it('aligns table columns', async () => {
    const base = await render('| a | b | c | d |\n|:--|:-:|--:|---|\n| 1 | 2 | 3 | 4 |');
    const cells = [...base.querySelectorAll('td')];
    expect(cells.map((c) => getComputedStyle(c).textAlign)).toEqual(['start', 'center', 'end', 'start']);
    expect([...base.querySelectorAll('th')].every((th) => th.getAttribute('scope') === 'col')).toBe(true);
  });

  it('links only to http, https, mailto and relative addresses', async () => {
    const base = await render(
      [
        '[a](https://example.com/x)',
        '[b](http://example.com/x)',
        '[c](mailto:me@example.com)',
        '[d](/local/path)',
        '[e](other.html#frag)',
        '[f](?q=1)',
        '<me@example.com>',
        '[g](ftp://example.com/x)',
        '[h](file:///etc/passwd)',
        '[i](tel:+1)'
      ].join('\n\n')
    );
    const links = [...base.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://example.com/x',
      'http://example.com/x',
      'mailto:me@example.com',
      '/local/path',
      'other.html#frag',
      '?q=1',
      'mailto:me@example.com'
    ]);
    // What may not be linked stays the text that was written.
    const texts = [...base.querySelectorAll('p')].map((p) => p.textContent);
    expect(texts.slice(7)).toEqual(['[g](ftp://example.com/x)', '[h](file:///etc/passwd)', '[i](tel:+1)']);
  });

  it('gives external links rel="noopener noreferrer", and only those', async () => {
    const base = await render('[out](https://example.com/x) [in](/x) [mail](mailto:a@b.co) [title](https://example.com "A title")');
    const [out, local, mail, titled] = base.querySelectorAll('a');
    expect(out.getAttribute('rel')).toBe('noopener noreferrer');
    expect(out.getAttribute('target')).toBe('_blank');
    expect(local.hasAttribute('rel')).toBe(false);
    expect(local.hasAttribute('target')).toBe(false);
    expect(mail.hasAttribute('rel')).toBe(false);
    expect(titled.getAttribute('title')).toBe('A title');
  });

  it('shows an image only with an allowed address and an alt', async () => {
    const base = await render(
      ['![A chart](https://example.com/c.png "Chart")', '![](https://example.com/no-alt.png)', '![x](ftp://example.com/c.png)'].join('\n\n')
    );
    const images = [...base.querySelectorAll('img')];
    expect(images.length).toBe(1);
    expect(images[0].getAttribute('src')).toBe('https://example.com/c.png');
    expect(images[0].getAttribute('alt')).toBe('A chart');
    expect(images[0].getAttribute('title')).toBe('Chart');
    expect(images[0].getAttribute('loading')).toBe('lazy');
    const [, noAlt, badUrl] = [...base.querySelectorAll('p')].map((p) => p.textContent);
    expect(noAlt).toBe('![](https://example.com/no-alt.png)');
    expect(badUrl).toBe('![x](ftp://example.com/c.png)');
  });

  it('renders images as links with no-images', async () => {
    const base = await render('![A chart](https://example.com/c.png)', 'no-images');
    expect(base.querySelector('img')).toBe(null);
    const link = base.querySelector('a');
    expect(link.getAttribute('href')).toBe('https://example.com/c.png');
    expect(link.textContent).toBe('A chart');
  });

  it('decodes character references to text', async () => {
    const base = await render('&amp; &lt;b&gt; &quot;q&quot; &#65;&#x42; &copy; &nosuchthing; &#0; AT&T');
    expect(base.textContent).toBe('& <b> "q" AB © &nosuchthing; � AT&T');
    expect(base.querySelector('b')).toBe(null);
  });

  it('reads its own text while value is unset, dedented, and follows changes to it', async () => {
    const el = await fixture(`<punica-markdown>
      # Title

      A *paragraph*.
    </punica-markdown>`);
    const base = el.shadowRoot.querySelector('[part="base"]');
    expect(shapes(base)).toBe('h1("Title") p("A ",em("paragraph"),".")');
    el.textContent = 'changed';
    await settle();
    expect(shapes(base)).toBe('p("changed")');
    el.value = '**value wins**';
    await settle();
    expect(shapes(base)).toBe('p(strong("value wins"))');
    el.value = '';
    await settle();
    expect(base.childNodes.length).toBe(0);
  });

  it('carries a part on every element a consumer may restyle', async () => {
    const base = await render(sample);
    const part = (selector) => base.querySelector(selector).getAttribute('part');
    expect(part('h2')).toBe('heading');
    expect(part('p')).toBe('paragraph');
    expect(part('a')).toBe('link');
    expect(part('p > code')).toBe('inline-code');
    expect(part('pre')).toBe('code-block');
    expect(part('pre > code')).toBe('code');
    expect(part('ul')).toBe('list');
    expect(part('li')).toBe('list-item');
    expect(part('input')).toBe('checkbox');
    expect(part('blockquote')).toBe('blockquote');
    expect(part('table')).toBe('table');
    expect(part('hr')).toBe('hr');
    expect(part('img')).toBe('image');
  });
});

describe('punica-markdown: emphasis edge cases', () => {
  afterEach(cleanup);

  it.each([
    ['***both***', 'p(em(strong("both")))'],
    ['**bold *and em* inside**', 'p(strong("bold ",em("and em")," inside"))'],
    ['*em **and bold** inside*', 'p(em("em ",strong("and bold")," inside"))'],
    ['**bold**text', 'p(strong("bold"),"text")'],
    ['in*tra*word', 'p("in",em("tra"),"word")'],
    ['snake_case_name and __init__', 'p("snake_case_name and ",strong("init"))'],
    ['file_name_here.txt', 'p("file_name_here.txt")'],
    ['2 * 3 * 4', 'p("2 * 3 * 4")'],
    ['**unclosed', 'p("**unclosed")'],
    ['unopened**', 'p("unopened**")'],
    // The first of two overlapping spans wins (CommonMark rule 15).
    ['*a _b* c_', 'p(em("a _b")," c_")'],
    ['**a _b** c_', 'p(strong("a _b")," c_")'],
    ['*a **b* c**', 'p(em("a ",em(em("b")," c")))'],
    ['****', 'hr()'],
    ['** not bold **', 'p("** not bold **")'],
    ['*a*b*c*', 'p(em("a"),"b",em("c"))'],
    ['~~a **b** c~~', 'p(del("a ",strong("b")," c"))'],
    ['**a ~~b** c~~', 'p(strong("a ~~b")," c~~")'],
    ['*[link*](/x)', 'p("*",a("link*"))'],
    ['`*code*` *em*', 'p(code("*code*")," ",em("em"))'],
    ['a\n*', 'p("a\\n*")'],
    ['a * b', 'p("a * b")'],
    ['_a_ _b_', 'p(em("a")," ",em("b"))'],
    ['"*quoted*"', 'p("\\"",em("quoted"),"\\"")'],
    ['*(**bold**)*', 'p(em("(",strong("bold"),")"))']
  ])('%s', async (source, expected) => {
    expect(shapes(await render(source))).toBe(expected);
  });
});

/* ---------------------------------------------------------------- security */

const TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'em', 'strong', 'del', 'code', 'pre', 'a', 'img',
  'blockquote', 'ul', 'ol', 'li', 'input', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
]);
const ATTRIBUTES = new Set([
  'part', 'class', 'href', 'title', 'target', 'rel', 'src', 'alt', 'loading', 'decoding', 'start', 'scope',
  'type', 'disabled', 'aria-label'
]);
const DANGEROUS_URL = /^[\s\0-\x20]*(javascript|data|vbscript|file|blob)\s*:/i;

/** Every way the rendered tree could carry something that runs, as strings. */
function hazards(root) {
  const found = [];
  for (const el of root.querySelectorAll('*')) {
    if (!TAGS.has(el.localName)) found.push(`element <${el.localName}>`);
    for (const attr of el.attributes) {
      if (/^on/i.test(attr.name)) found.push(`handler ${attr.name} on <${el.localName}>`);
      if (!ATTRIBUTES.has(attr.name)) found.push(`attribute ${attr.name} on <${el.localName}>`);
      if (DANGEROUS_URL.test(attr.value) && ['href', 'src', 'srcset', 'action', 'formaction', 'xlink:href'].includes(attr.name)) {
        found.push(`url ${attr.name}="${attr.value}"`);
      }
    }
    if (el.localName === 'a' && el.hasAttribute('href') && !['http:', 'https:', 'mailto:'].includes(el.protocol)) {
      found.push(`link protocol ${el.protocol}`);
    }
    if (el.localName === 'img' && !/^https?:$/.test(new URL(el.src).protocol)) found.push(`image protocol ${el.src}`);
  }
  return found;
}

const open = '<scr' + 'ipt>';
const close = '</scr' + 'ipt>';

describe('punica-markdown: security', () => {
  afterEach(cleanup);

  it.each([
    ['a script element', `${open}window.__pwned = 1${close}`],
    ['a script element among text', `before ${open}window.__pwned = 1${close} after`],
    ['a script in a heading', `# ${open}window.__pwned = 1${close}`],
    ['a script in a list', `- ${open}window.__pwned = 1${close}`],
    ['a script in a table', `| a |\n|---|\n| ${open}window.__pwned = 1${close} |`],
    ['a script in a quote', `> ${open}window.__pwned = 1${close}`],
    ['an image with onerror', '<img src=x onerror="window.__pwned = 1">'],
    ['an svg with onload', '<svg onload="window.__pwned = 1"></svg>'],
    ['an iframe', '<iframe src="javascript:window.__pwned = 1"></iframe>'],
    ['an html anchor', '<a href="javascript:window.__pwned = 1">x</a>'],
    ['an inline handler on a block', '<div onclick="window.__pwned = 1">x</div>'],
    ['a style element', '<style>* { display: none }</style>'],
    ['an html comment', '<!-- <b>x</b> -->'],
    ['a javascript link', '[x](javascript:alert(1))'],
    ['a javascript link, mixed case', '[x](JaVaScRiPt:alert(1))'],
    ['a javascript link with a tab inside', '[x](java\tscript:alert(1))'],
    ['a javascript link with a newline inside', '[x](<java\nscript:alert(1)>)'],
    ['a javascript link behind spaces', '[x](   javascript:alert(1))'],
    ['a javascript link behind a control character', '[x](\x01javascript:alert(1))'],
    ['a javascript link in angle brackets', '[x](<javascript:alert(1)>)'],
    ['a javascript link by character references', '[x](&#106;avascript:alert(1))'],
    ['a javascript link by a hex reference', '[x](&#x6A;avascript&#58;alert(1))'],
    ['a javascript link by escapes', '[x](j\\avascript\\:alert(1))'],
    ['a javascript autolink', '<javascript:alert(1)>'],
    ['a javascript image', '![x](javascript:alert(1))'],
    ['a javascript image, mixed case', '![x](JAVASCRIPT:alert(1))'],
    ['a data link', '[x](data:text/html,<b>hi</b>)'],
    ['a data link, base64', '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
    ['a data image', '![x](data:image/svg+xml,<svg onload=alert(1)>)'],
    ['a vbscript link', '[x](vbscript:msgbox(1))'],
    ['a file link', '[x](file:///etc/passwd)'],
    ['a blob link', '[x](blob:https://example.com/1)'],
    ['a link whose title tries to break out', '[x](https://example.com "\\" onmouseover=\\"window.__pwned = 1")'],
    ['an image whose alt tries to break out', '![" onerror="window.__pwned = 1](https://example.com/a.png)'],
    ['a link whose address tries to break out', '[x](https://example.com/"onmouseover="window.__pwned=1)'],
    ['a link text holding html', '[<img src=x onerror="window.__pwned = 1">](https://example.com)'],
    ['a code fence language that tries to break out', '```"><img src=x onerror=alert(1)>\ncode\n```'],
    ['html in inline code', '`<img src=x onerror="window.__pwned = 1">`'],
    ['html in a code block', '```html\n<img src=x onerror="window.__pwned = 1">\n```'],
    ['character references spelling a tag', '&lt;img src=x onerror=&quot;window.__pwned = 1&quot;&gt;'],
    ['numeric references spelling a tag', '&#60;img src=x onerror=window.__pwned=1&#62;'],
    ['emphasis around html', '**<img src=x onerror="window.__pwned = 1">**'],
    ['emphasis split across a link', '*[a*](javascript:alert(1))'],
    ['nested emphasis around a javascript link', '***[x](javascript:alert(1))***'],
    ['unbalanced emphasis around a tag', `**_<b onmouseover="window.__pwned = 1">x_**`],
    ['a nested link', '[a [b](javascript:alert(1)) c](javascript:alert(2))'],
    ['a protocol-relative link stays a link, not a script', '[x](//example.com/a)']
  ])('%s leaves nothing that runs', async (_name, source) => {
    delete window.__pwned;
    const el = await fixture('<punica-markdown></punica-markdown>');
    el.value = source;
    await settle();
    await settle();
    const root = el.shadowRoot;
    expect(root.querySelector('script')).toBe(null);
    expect(hazards(root)).toEqual([]);
    expect(window.__pwned).toBe(undefined);
    // The same holds with images turned into links.
    el.noImages = true;
    await settle();
    expect(hazards(root)).toEqual([]);
  });

  it('shows raw html as the text that was written', async () => {
    const source = `<b>bold</b> and ${open}alert(1)${close} and <img src=x onerror=alert(1)>`;
    const base = await render(source);
    expect(base.textContent).toBe(source);
    expect(base.querySelectorAll('b, script, img').length).toBe(0);
  });

  it('shows a refused link as the text that was written', async () => {
    const base = await render('[x](javascript:alert(1)) and ![y](javascript:alert(2)) and [z](data:text/html,hi)');
    expect(base.textContent).toBe('[x](javascript:alert(1)) and ![y](javascript:alert(2)) and [z](data:text/html,hi)');
    expect(base.querySelectorAll('a, img').length).toBe(0);
  });

  it.each([
    ['https://example.com', true],
    ['HTTP://EXAMPLE.COM', true],
    ['mailto:a@b.co', true],
    ['/a/b', true],
    ['a/b?c=d#e', true],
    ['#frag', true],
    ['//example.com/x', true],
    ['javascript:alert(1)', false],
    ['  javascript:alert(1)', false],
    ['java\nscript:alert(1)', false],
    ['data:text/html,x', false],
    ['vbscript:x', false],
    ['file:///x', false],
    ['about:blank', false],
    ['', false],
    [null, false]
  ])('safeUrl(%j) allowed: %s', (url, allowed) => {
    expect(safeUrl(url) !== null).toBe(allowed);
  });
});

/* --------------------------------------------------------------- streaming */

const story = [
  '# Streaming',
  '',
  'The first paragraph has **bold** text and a [link](https://example.com).',
  '',
  '- one',
  '- two with `code`',
  '  - nested',
  '',
  '```js',
  'const a = 1;',
  'const b = 2;',
  '```',
  '',
  '> a quote',
  '> on two lines',
  '',
  '| a | b |',
  '|---|---|',
  '| 1 | 2 |',
  '',
  '1. first',
  '2. second',
  '',
  'The end.'
].join('\n');

describe('punica-markdown: streaming', () => {
  afterEach(cleanup);

  it('keeps every earlier block node while the source grows, a character at a time', async () => {
    const el = await fixture('<punica-markdown streaming></punica-markdown>');
    const base = el.shadowRoot.querySelector('[part="base"]');
    let previous = [];
    let replaced = 0;
    for (let length = 1; length <= story.length; length++) {
      el.value = story.slice(0, length);
      await el.updateComplete;
      const current = [...base.childNodes];
      // Only the last block of the previous render may have changed.
      for (let i = 0; i < previous.length - 1; i++) {
        expect(current[i], `block ${i} after ${JSON.stringify(story.slice(0, length).slice(-12))}`).toBe(previous[i]);
      }
      if (previous.length && current[previous.length - 1] !== previous[previous.length - 1]) replaced++;
      previous = current;
    }
    expect(shapes(base)).toBe(shapes(await render(story)));
    expect(previous.length).toBe(8);
    expect(replaced).toBeGreaterThan(0);
  });

  it('renders the same tree streamed as rendered at once, whatever the chunking', async () => {
    const whole = shapes(await render(story));
    for (const size of [2, 7, 31]) {
      const el = await fixture('<punica-markdown streaming></punica-markdown>');
      for (let length = size; length < story.length + size; length += size) {
        el.value = story.slice(0, length);
        await el.updateComplete;
      }
      expect(shapes(el.shadowRoot.querySelector('[part="base"]'))).toBe(whole);
    }
  });

  it('keeps a selection inside a finished block', async () => {
    const el = await fixture('<punica-markdown streaming></punica-markdown>');
    const base = el.shadowRoot.querySelector('[part="base"]');
    el.value = 'A finished paragraph.\n\nA second';
    await settle();
    const text = base.querySelector('p').firstChild;
    const range = document.createRange();
    range.setStart(text, 2);
    range.setEnd(text, 10);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    for (const more of [' paragraph', ' that grows.\n\n- and', ' a list\n- of two']) {
      el.value += more;
      await settle();
    }
    expect(base.querySelector('p').firstChild).toBe(text);
    expect(text.isConnected).toBe(true);
    expect(range.startContainer).toBe(text);
    expect(range.startOffset).toBe(2);
    expect(range.endOffset).toBe(10);
    expect(range.toString()).toBe('finished');
    expect(range.collapsed).toBe(false);
    selection.removeAllRanges();
  });

  it('grows a code block and a list in place', async () => {
    const el = await fixture('<punica-markdown streaming></punica-markdown>');
    const base = el.shadowRoot.querySelector('[part="base"]');
    el.value = '- one\n- two\n\n```js\nconst a';
    await settle();
    const list = base.querySelector('ul');
    const [one, two] = list.children;
    const pre = base.querySelector('pre');
    const code = pre.querySelector('code');
    el.value += ' = 1;\nconst b = 2;';
    await settle();
    expect(base.querySelector('pre')).toBe(pre);
    expect(pre.querySelector('code')).toBe(code);
    expect(code.textContent).toBe('const a = 1;\nconst b = 2;');

    el.value = '- one\n- two\n- three';
    await settle();
    expect(base.querySelector('ul')).toBe(list);
    expect(list.children[0]).toBe(one);
    expect(list.children[1]).toBe(two);
    expect(list.children.length).toBe(3);
    expect(base.querySelector('pre')).toBe(null);
  });

  it('is busy while streaming', async () => {
    const el = await fixture('<punica-markdown streaming></punica-markdown>');
    expect(el.internals.ariaBusy).toBe('true');
    expect(el.matches(':state(streaming)')).toBe(true);
    el.streaming = false;
    await settle();
    expect(el.internals.ariaBusy).toBe(null);
    expect(el.matches(':state(streaming)')).toBe(false);
  });

  it('parses a long reply quickly enough to re-parse on every chunk', () => {
    const long = Array.from({ length: 400 }, (_, i) => `Paragraph ${i} with **bold**, _em_, \`code\` and [a link](https://example.com/${i}).`).join('\n\n');
    const started = performance.now();
    const blocks = parseMarkdown(long);
    expect(blocks.length).toBe(400);
    expect(performance.now() - started).toBeLessThan(200);
  });
});
