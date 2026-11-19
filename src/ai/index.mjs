// @punica/components/ai: the elements' API and a markup validator, for
// tools and for models. `createKnowledge` and `createValidator` take a parsed
// custom-elements.json; in Node, `@punica/components/ai/node` loads the
// package's own.
export { createKnowledge, enumValues, closest, distance, normalizeTag, firstSentence, DOCS_URL } from './knowledge.mjs';
export { createValidator, guessKind } from './validate.mjs';
