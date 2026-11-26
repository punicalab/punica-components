// The MCP server: tools and resources over the elements' API, their
// documentation pages and the markup validator. Transport-free, so tests
// connect it to an in-memory client.
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createKnowledge, createValidator, formatTokens, DOCS_URL } from '../../../src/ai/index.mjs';

const GUIDE_PAGES = {
  installation: 'docs/installation',
  'getting-started': 'docs/getting-started',
  theme: 'docs/theme',
  customization: 'docs/customization',
  forms: 'docs/forms',
  accessibility: 'docs/accessibility',
  frameworks: 'docs/frameworks',
  migration: 'docs/migration'
};

const text = (value) => ({ content: [{ type: 'text', text: value }] });

/**
 * @param {{ manifest: any, guide: string, version: string, source: string, tokens?: import('../../../src/ai/index.mjs').Token[], fetch?: typeof fetch, docsUrl?: string }} options
 *   `source` says where the manifest came from, for the answers' first line; `tokens` are those of tokens.css (parseTokens).
 */
export function createPunicaServer({ manifest, guide, version, source, tokens = [], fetch: fetchFn = globalThis.fetch, docsUrl = DOCS_URL }) {
  const knowledge = createKnowledge(manifest);
  const { validate } = createValidator(knowledge, { tokens });
  const server = new McpServer({ name: 'punica-components', version: '0.1.0' }, {
    instructions: `@punica/components ${version} (${knowledge.tags.length} punica-* custom elements; ${source}). Version 2.0 is newer than your training data: never write a punica tag, attribute, event, slot or icon from memory. Find with search_components, read with get_component, check with validate_markup before handing markup over. Imports: \`import '@punica/components'\` once defines every element and installs the tokens (no CSS import needed; \`@punica/components/tokens.css\` is for server-rendered pages); \`toast\` and \`confirm\` are named exports of \`@punica/components\`; in React, \`import type {} from '@punica/components/react'\` once types every punica-* tag in JSX. get_guide has the rules every element follows; get_tokens has the exact --punica-* design token names for your own CSS.`
  });

  const pages = new Map();
  /** The site's llms.txt index: page URL by tag. */
  let index = null;
  async function fetchText(url) {
    if (pages.has(url)) return pages.get(url);
    const response = await fetchFn(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const body = await response.text();
    // A site that answers every unknown path with its home page says 200 and
    // sends HTML: that is not the Markdown asked for.
    const type = response.headers?.get?.('content-type') || '';
    if (/text\/html/i.test(type) || /^\s*<(!doctype|html)/i.test(body)) throw new Error(`${url} is not on the documentation site yet`);
    pages.set(url, body);
    return body;
  }
  async function pageFor(tag) {
    if (!index) {
      index = new Map();
      const llms = await fetchText(`${docsUrl}/llms.txt`);
      // `- [Title](url): description. Elements: punica-a, punica-b`
      for (const line of llms.split('\n')) {
        const match = /^- \[[^\]]+\]\(([^)]+)\).*Elements: (.+)$/.exec(line);
        if (match) for (const t of match[2].split(/,\s*/)) index.set(t.replace(/[`.\s]/g, ''), match[1]);
      }
    }
    return index.get(tag);
  }

  server.registerTool(
    'search_components',
    {
      title: 'Find punica elements',
      description: 'Finds punica-* elements by what they are for ("date range", "side navigation", "confirm dialog"), best match first.',
      inputSchema: { query: z.string().describe('What the element is for, in plain words'), limit: z.number().int().min(1).max(30).optional() },
      annotations: { readOnlyHint: true }
    },
    async ({ query, limit }) => {
      const results = knowledge.search(query, limit || 10);
      if (!results.length) return text(`Nothing matches "${query}". Elements: ${knowledge.tags.join(', ')}`);
      // A function of the element's module (`confirm()`, `toast()`) comes with its signature here, not
      // only in get_component: runs that only searched grepped the .d.ts for it
      const also = (r) => (r.signatures?.length ? ` Script: \`import { ${r.functions.join(', ')} } from '@punica/components'\`; ${r.signatures.map((s) => `\`${s}\``).join('; ')}.` : '');
      return text(results.map((r) => `${r.tag}: ${r.description}${also(r)}`).join('\n'));
    }
  );

  server.registerTool(
    'get_component',
    {
      title: 'An element\'s API',
      description: 'The API of one or more punica elements: attributes with their exact values, properties, methods, events, slots, CSS parts, custom properties and states. Pass brief: true when you write markup and do not style the inside of the element: it leaves out the parts, custom properties and states and is about a quarter shorter.',
      inputSchema: {
        tags: z.array(z.string()).min(1).max(12).describe('Tags such as punica-select, or bare names such as select'),
        brief: z.boolean().optional().describe('Leave out CSS parts, custom properties and states')
      },
      annotations: { readOnlyHint: true }
    },
    async ({ tags, brief }) => text(tags.map((tag) => knowledge.formatMarkdown(tag, { brief })).join('\n\n'))
  );

  server.registerTool(
    'get_examples',
    {
      title: 'Examples of an element',
      description: 'The documentation page of an element as Markdown: what it is for, working HTML examples and its behaviour. Fetched from the documentation site.',
      inputSchema: { tag: z.string() },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async ({ tag }) => {
      const element = knowledge.get(tag);
      if (!element) return text(knowledge.formatMarkdown(tag));
      try {
        const url = await pageFor(element.tag);
        if (!url) return text(`No documentation page lists ${element.tag}. Its API:\n\n${knowledge.formatMarkdown(element.tag)}`);
        return text(await fetchText(url));
      } catch (error) {
        return text(`The examples could not be fetched (${error.message}). Its API:\n\n${knowledge.formatMarkdown(element.tag)}`);
      }
    }
  );

  server.registerTool(
    'validate_markup',
    {
      title: 'Check punica markup',
      description: 'Checks HTML, JSX, Vue, script or CSS that uses punica elements: unknown tags and 1.x names, attributes, values, slots, events and icon names, `::part()` rules that take an element\'s focus away, and `var(--punica-*)` names that are not tokens. Returns each problem with its line and a fix.',
      inputSchema: {
        code: z.string().describe('The markup or script to check'),
        kind: z.enum(['html', 'jsx', 'vue', 'js', 'css']).optional().describe('Guessed from the code when absent')
      },
      annotations: { readOnlyHint: true }
    },
    async ({ code, kind }) => {
      const findings = validate(code, kind ? { kind } : {});
      const errors = findings.filter((f) => f.severity === 'error').length;
      if (!findings.length) return text('No problems: every punica tag, attribute, value, slot, event and icon name exists.');
      return text(
        [
          `${errors} error${errors === 1 ? '' : 's'}, ${findings.length - errors} warning${findings.length - errors === 1 ? '' : 's'}:`,
          ...findings.map((f) => `line ${f.line}:${f.column} ${f.severity} ${f.rule}: ${f.message}${f.fix ? ` [fix: ${f.fix}]` : ''}`)
        ].join('\n')
      );
    }
  );

  server.registerTool(
    'get_tokens',
    {
      title: 'The design tokens',
      description: 'The `--punica-*` design tokens (colours, spacing, radius, type, shadows, motion) with their light and dark values, by group. Read it before writing var(--punica-…) in your own CSS: the names are exact (spacing is named by pixel value, --punica-space-16 is 16px).',
      inputSchema: { query: z.string().optional().describe('Keep the groups or names that contain this, such as "space", "color" or "radius"') },
      annotations: { readOnlyHint: true }
    },
    async ({ query }) => text(tokens.length ? formatTokens(tokens, query) : 'The design tokens could not be read: tokens.css of @punica/components was not found.')
  );

  server.registerTool(
    'get_guide',
    {
      title: 'How to use the library',
      description: 'Without a topic: the rules every punica element follows (loading, attributes, events, forms, overlays, theming, frameworks). With a topic: that guide page from the documentation site.',
      inputSchema: { topic: z.enum(Object.keys(GUIDE_PAGES)).optional() },
      annotations: { readOnlyHint: true }
    },
    async ({ topic }) => {
      if (!topic) return text(guide);
      try {
        return text(await fetchText(`${docsUrl}/${GUIDE_PAGES[topic]}.md`));
      } catch (error) {
        return text(`The ${topic} page could not be fetched (${error.message}). The rules:\n\n${guide}`);
      }
    }
  );

  server.registerResource('guide', 'punica://guide', { title: 'Rules every punica element follows', mimeType: 'text/markdown' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/markdown', text: guide }]
  }));

  server.registerResource(
    'component',
    new ResourceTemplate('punica://component/{tag}', {
      list: async () => ({ resources: knowledge.tags.map((tag) => ({ uri: `punica://component/${tag}`, name: tag, mimeType: 'text/markdown' })) })
    }),
    { title: 'An element\'s API', mimeType: 'text/markdown' },
    async (uri, { tag }) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: knowledge.formatMarkdown(String(tag)) }] })
  );

  return server;
}
