export interface AttributeInfo { name: string; property: string; type: string; values: string[] | null; description: string }
export interface NamedInfo { name: string; description: string }
export interface ElementInfo {
  tag: string;
  className: string;
  module: string;
  description: string;
  attributes: AttributeInfo[];
  properties: (NamedInfo & { type: string; readonly: boolean })[];
  methods: (NamedInfo & { signature: string })[];
  /** `detail` is the type of the event's detail, empty when undocumented. */
  events: (NamedInfo & { detail: string })[];
  slots: NamedInfo[];
  parts: NamedInfo[];
  cssProperties: NamedInfo[];
  states: NamedInfo[];
  childAttributes: string[];
}
export interface Knowledge {
  elements: Map<string, ElementInfo>;
  tags: string[];
  allEvents: Set<string>;
  icons: string[];
  list(): { tag: string; description: string }[];
  get(tag: string): ElementInfo | null;
  /** Ranked matches; `functions` and `signatures` are those the element's module exports (`confirm`, `toast`). */
  search(query: string, limit?: number): { tag: string; description: string; functions: string[]; signatures: string[]; score: number }[];
  legacy(tag: string): { tag: string; replacement: string | null; message: string } | null;
  /** The element's API as Markdown; `brief` leaves out what only styling needs. */
  formatMarkdown(tag: string, options?: { brief?: boolean }): string;
}
export interface Finding { line: number; column: number; severity: 'error' | 'warning'; rule: string; message: string; fix?: string }
export type SourceKind = 'html' | 'jsx' | 'vue' | 'js' | 'css';
export declare const DOCS_URL: string;
export declare function createKnowledge(manifest: unknown): Knowledge;
export declare function createValidator(knowledge: Knowledge): { validate(source: string, options?: { kind?: SourceKind }): Finding[] };
export declare function guessKind(source: string): SourceKind;
export declare function enumValues(type: string | undefined): string[] | null;
export declare function closest(name: string, names: Iterable<string>): string | null;
export declare function distance(a: string, b: string): number;
export declare function normalizeTag(tag: string): string;
export declare function firstSentence(text: string): string;
