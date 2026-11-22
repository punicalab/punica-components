// The type declarations (dist/types), checked with the compiler itself. Run
// by Node, not in the browser like the other tests: build first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const declarations = fileURLToPath(
  new URL('../dist/types/index.d.ts', import.meta.url)
);
const text = readFileSync(declarations, 'utf8');
const manifest = JSON.parse(
  readFileSync(new URL('../custom-elements.json', import.meta.url), 'utf8')
);

/** What TypeScript says about code that imports the package. */
const check = (code) => {
  const file = fileURLToPath(new URL('./virtual-usage.ts', import.meta.url));
  const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    types: [],
    paths: { '@punica/components': [declarations] }
  };
  const host = ts.createCompilerHost(options);
  const read = host.getSourceFile.bind(host);
  const exists = host.fileExists.bind(host);

  host.getSourceFile = (name, ...rest) =>
    name === file
      ? ts.createSourceFile(name, code, ts.ScriptTarget.ES2022, true)
      : read(name, ...rest);
  host.fileExists = (name) => name === file || exists(name);

  return ts
    .getPreEmitDiagnostics(ts.createProgram([file], options, host))
    .map((one) => ts.flattenDiagnosticMessageText(one.messageText, ' '));
};

test('every function a module exports beside its element is declared', () => {
  const functions = manifest.modules
    .filter((mod) => (mod.declarations || []).some((decl) => decl.tagName))
    .flatMap((mod) =>
      (mod.declarations || []).filter(
        (decl) =>
          decl.kind === 'function' &&
          (mod.exports || []).some(
            (e) => e.kind === 'js' && e.name === decl.name
          )
      )
    )
    .map((fn) => fn.name)
    .sort();

  assert.deepEqual(functions, ['confirm', 'qrMatrix', 'toast']);

  for (const name of functions) {
    assert.match(text, new RegExp(`^export function ${name}\\(`, 'm'), name);
  }
});

test('the helpers are typed as the guide shows them used', () => {
  assert.deepEqual(
    check(`
      import { confirm, qrMatrix, toast } from '@punica/components';

      const shown: HTMLElement = toast('Saved', { color: 'success', duration: 3000 });
      const sure: Promise<boolean> = confirm({ heading: 'Delete?', confirmLabel: 'Delete', color: 'error' });
      const matrix: boolean[][] | null = qrMatrix('https://punicalab.com', 'H');

      toast('Saved');
      confirm();
      export { shown, sure, matrix };
    `),
    []
  );
});

test('every element says when its pending update has run', () => {
  assert.deepEqual(
    check(`
      import type { PunicaDialog, PunicaDrawer } from '@punica/components';

      const dialog: PunicaDialog = document.createElement('punica-dialog');
      const drawer: PunicaDrawer = document.createElement('punica-drawer');
      const done: Promise<void> = dialog.updateComplete;
      void drawer.updateComplete.then(() => drawer.hide());
      export { done };
    `),
    []
  );
});

test('what the helpers do not take is refused', () => {
  const problems = check(`
    import { confirm, toast } from '@punica/components';

    toast(1);
    toast('Saved', { colour: 'success' });
    confirm({ heading: 1 });
  `);

  assert.equal(problems.length, 3, problems.join('\n'));
});

test('the elements are still declared', () => {
  assert.deepEqual(
    check(`
      import type { PunicaButton } from '@punica/components';

      const button = document.createElement('punica-button');
      const typed: PunicaButton = button;

      button.loading = true;
      export { typed };
    `),
    []
  );
});

test('a component imported by its own path is typed', () => {
  const { exports } = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(exports['./components/*'].types, './dist/types/index.d.ts');
  assert.equal(exports['./components/*'].default, './dist/esm/components/*');
});
