import type { Knowledge, Finding, SourceKind, Token } from './index.js';
export * from './index.js';
/** The package's own custom-elements.json, read once. */
export declare const knowledge: Knowledge;
/** The package's own design tokens (tokens.css). */
export declare const tokens: Token[];
/** Checks `var(--punica-*)` names against `tokens` as well. */
export declare function validate(source: string, options?: { kind?: SourceKind }): Finding[];
