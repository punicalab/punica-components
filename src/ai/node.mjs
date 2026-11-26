// The package's own custom-elements.json, loaded once.
import { readFileSync } from 'node:fs';
import { createKnowledge } from './knowledge.mjs';
import { createValidator } from './validate.mjs';
import { parseTokens } from './tokens.mjs';

export * from './index.mjs';

const manifest = JSON.parse(readFileSync(new URL('../../custom-elements.json', import.meta.url), 'utf8'));

/** dist/tokens.css beside the built dist/ai, src/tokens/tokens.css beside the source */
function readTokens() {
  for (const path of ['../tokens.css', '../tokens/tokens.css']) {
    try {
      return parseTokens(readFileSync(new URL(path, import.meta.url), 'utf8'));
    } catch {}
  }
  return [];
}

export const knowledge = createKnowledge(manifest);
export const tokens = readTokens();
export const { validate } = createValidator(knowledge, { tokens });
