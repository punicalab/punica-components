import { describe, expect, it } from 'vitest';
import css from '../src/tokens/tokens.css?raw';
import { color, declarations, designTokens, pathOf } from '../scripts/design-tokens.mjs';

const { light, dark } = designTokens(css);
const leaves = (tree, path = []) =>
  Object.entries(tree).flatMap(([key, node]) =>
    key.startsWith('$') ? [] : node.$type ? [[path.concat(key).join('.'), node]] : leaves(node, path.concat(key))
  );
const TYPES = new Set(['color', 'dimension', 'duration', 'number', 'fontFamily', 'fontWeight', 'cubicBezier', 'shadow', 'border']);

describe('design tokens', () => {
  it('has every token of tokens.css once, in both schemes', () => {
    const properties = declarations(css).map(([p]) => p);
    for (const tree of [light, dark]) {
      const named = leaves(tree).map(([, t]) => t.$extensions['com.punicalab.css']);
      expect(named.sort()).toEqual([...properties].sort());
    }
  });

  it('gives each a DTCG type and a value of its shape', () => {
    for (const [path, t] of leaves(light)) {
      expect(TYPES.has(t.$type), path).toBe(true);
      if (t.$type === 'color') {
        expect(t.$value.colorSpace).toBe('srgb');
        expect(t.$value.components).toHaveLength(3);
        expect(t.$value.hex).toMatch(/^#[0-9a-f]{6}$/);
      }
      if (t.$type === 'dimension') expect(['px', 'rem']).toContain(t.$value.unit);
    }
  });

  it('splits light-dark() pairs: only colours differ between the schemes', () => {
    const darkByPath = new Map(leaves(dark));
    const differ = leaves(light).filter(([path, t]) => JSON.stringify(t.$value) !== JSON.stringify(darkByPath.get(path).$value)).map(([, t]) => t.$type);
    expect(differ.length).toBeGreaterThan(30);
    expect(new Set(differ)).toEqual(new Set(['color']));
    expect(light.color.primary.$value.hex).toBe('#5560a9');
    expect(dark.color.primary.$value.hex).toBe('#a0a9ee');
  });

  it('keeps references as references', () => {
    expect(light['focus-ring'].default.$value).toEqual({ width: '{focus-ring.width}', style: 'solid', color: '{color.focus}' });
    const paths = new Set(leaves(light).map(([p]) => p));
    expect(paths.has('focus-ring.width') && paths.has('color.focus')).toBe(true);
  });

  it('reads colours with alpha', () => {
    expect(color('rgb(111 126 140 / 10%)')).toEqual({ colorSpace: 'srgb', components: [0.4353, 0.4941, 0.549], alpha: 0.1, hex: '#6f7e8c' });
    expect(color('#ffffff')).toEqual({ colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' });
  });

  it('names tokens by group', () => {
    expect(pathOf('--punica-font-size-sm')).toEqual(['font', 'size', 'sm']);
    expect(pathOf('--punica-radius')).toEqual(['radius', 'default']);
    expect(pathOf('--punica-line-height-heading')).toEqual(['line-height', 'heading']);
  });
});
