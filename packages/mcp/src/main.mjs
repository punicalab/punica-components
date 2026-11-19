// punica-components-mcp: the MCP server over stdio. It reads the
// custom-elements.json of the @punica/components installed in the project it
// is started in, so the answers match that version; without one it uses the
// copy it was built with.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPunicaServer } from './create.mjs';

function load() {
  try {
    const require = createRequire(join(process.cwd(), 'package.json'));
    const manifestPath = require.resolve('@punica/components/custom-elements.json');
    // package.json is not in the package's exports; it sits beside the manifest.
    const pkg = JSON.parse(readFileSync(join(dirname(manifestPath), 'package.json'), 'utf8'));
    return { manifest: JSON.parse(readFileSync(manifestPath, 'utf8')), version: pkg.version, source: 'the version installed in this project' };
  } catch {
    const bundled = new URL('./custom-elements.json', import.meta.url);
    const meta = JSON.parse(readFileSync(new URL('./bundled.json', import.meta.url), 'utf8'));
    return { manifest: JSON.parse(readFileSync(bundled, 'utf8')), version: meta.version, source: 'the copy bundled with this server; install @punica/components in the project for its own version' };
  }
}

const { manifest, version, source } = load();
const guide = readFileSync(new URL('./guide.md', import.meta.url), 'utf8');
const server = createPunicaServer({ manifest, guide, version, source });
await server.connect(new StdioServerTransport());
