// The package's own custom-elements.json, loaded once.
import { readFileSync } from 'node:fs';
import { createKnowledge } from './knowledge.mjs';
import { createValidator } from './validate.mjs';

export * from './index.mjs';

const manifest = JSON.parse(readFileSync(new URL('../../custom-elements.json', import.meta.url), 'utf8'));

export const knowledge = createKnowledge(manifest);
export const { validate } = createValidator(knowledge);
