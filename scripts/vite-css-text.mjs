// Vite plugin: a .css file under src/components or src/tokens imports as its
// text, the way esbuild's `text` loader builds it for dist/.
import { readFile } from 'node:fs/promises';

const PREFIX = '\0punica-css:';

export function cssText() {
  return {
    name: 'punica-css-text',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.endsWith('.css') || !importer) return null;
      const resolved = await this.resolve(source, importer, { skipSelf: true });
      if (!resolved) return null;
      if (!/\/src\/(components|tokens)\//.test(resolved.id)) return null;
      if (!/\.m?js$/.test(importer.split('?')[0])) return null;
      return PREFIX + resolved.id + '.js';
    },
    async load(id) {
      if (!id.startsWith(PREFIX)) return null;
      const file = id.slice(PREFIX.length, -3);
      this.addWatchFile(file);
      return `export default ${JSON.stringify(await readFile(file, 'utf8'))};`;
    }
  };
}
