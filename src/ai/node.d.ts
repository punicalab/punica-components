import type { Knowledge, Finding, SourceKind } from './index.js';
export * from './index.js';
/** The package's own custom-elements.json, read once. */
export declare const knowledge: Knowledge;
export declare function validate(source: string, options?: { kind?: SourceKind }): Finding[];
