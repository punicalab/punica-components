const { readdir, readFile, writeFile } = require('fs/promises');
const chokidar = require('chokidar');
const { minify } = require('terser');
const root = './src/components/';

/**
 *
 */
async function main() {
  try {
    const bundle = await bundleComponents();
    const result = await minify(bundle, { compress: true, mangle: true });
    await writeFile('./src/assets/build.min.js', result.code || bundle, 'utf8');
    console.log('build.min.js generated.');
  } catch (err) {
    console.error('Build failed:', err);
  }
}

async function bundleComponents() {
  // Include base class first
  const baseClass = await readSafe('./src/components/base.js');
  let output = baseClass ? baseClass + '\n' : '';

  const dirNames = await getDirectories();

  for (const d of dirNames.sort()) {
    const entries = await readdir(`${root}${d}`, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith('.js'))
      .map((e) => e.name)
      .sort();

    for (const file of files) {
      const fileName = file.slice(0, -3); // strip .js
      const jsPath = `${root}${d}/${fileName}.js`;
      const cssPath = `${root}${d}/${fileName}.css`;

      const jsData = await readSafe(jsPath);
      const cssData = await readSafe(cssPath);

      if (!jsData) continue;

      if (cssData) {
        output += jsData.replace(
          /(<style\b[^>]*>)[\s\S]*?(<\/style>)/i,
          '<style>' + cssData.replace(/\n/g, ' ') + '</style>'
        );
      } else {
        output += jsData;
      }
      output += '\n';
    }
  }

  return output;
}

async function readSafe(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

/**
 *
 * @returns
 */
const getDirectories = async () =>
  (await readdir(`${root}`, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

// initial build
main();

// watch for changes
chokidar.watch(`${root}`).on('change', () => main());
