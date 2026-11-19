import { describe, it, expect } from 'vitest';
import { transform } from '../scripts/codemod-rules.mjs';

describe('codemod 2.0', () => {
  it('renames tokens', () => {
    const { text } = transform('a{color:var(--primary-main);background:var(--error-light);padding:var(--spacing-16);border-radius:var(--root-border-radius);opacity:var(--disabled-opacity);color:var(--disabled)}');
    expect(text).toBe('a{color:var(--punica-color-primary);background:var(--punica-color-error-light);padding:var(--punica-space-16);border-radius:var(--punica-radius);opacity:var(--punica-disabled-opacity);color:var(--punica-color-text-muted)}');
  });

  it('renames tags one to one, in one pass', () => {
    const { text } = transform('<punica-tab><punica-tab-item>A</punica-tab-item></punica-tab><punica-tab-panel></punica-tab-panel><punica-modal-header/>');
    expect(text).toBe('<punica-tabs><punica-tab>A</punica-tab></punica-tabs><punica-tab-panel></punica-tab-panel><punica-dialog-header/>');
  });

  it('leaves already migrated names alone', () => {
    const source = 'var(--punica-color-primary) <punica-tabs></punica-tabs> --punica-space-8';
    expect(transform(source).text).toBe(source);
  });

  it('reports what it cannot move', () => {
    const { notes, text } = transform('<punica-typography variant="h1">x</punica-typography>\n<punica-button fullwidth></punica-button>\nel.addEventListener("split-change", f)');
    expect(text).toContain('punica-typography');
    expect(notes.map((n) => n.line)).toEqual([1, 2, 3]);
  });
});
