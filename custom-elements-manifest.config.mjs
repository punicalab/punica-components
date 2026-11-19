// custom-elements.json is generated from the JSDoc on each component class,
// and from it the editor data: VS Code's custom data and JetBrains' web-types.
import { customElementVsCodePlugin } from 'custom-element-vs-code-integration';
import { customElementJetBrainsPlugin } from 'custom-element-jet-brains-integration';

const docs = (tag) => [{ name: 'Documentation', url: `https://components.punicalab.com/search?q=${encodeURIComponent(tag)}` }];

export default {
  globs: ['src/components/**/*.js'],
  exclude: ['src/components/**/*.test.js'],
  outdir: '.',
  litelement: false,
  plugins: [
    customElementVsCodePlugin({
      outdir: 'dist',
      htmlFileName: 'vscode.html-custom-data.json',
      cssFileName: 'vscode.css-custom-data.json',
      referencesTemplate: (name, tag) => docs(tag || name)
    }),
    customElementJetBrainsPlugin({
      outdir: 'dist',
      webTypesFileName: 'web-types.json',
      packageJson: false,
      referenceTemplate: (name, tag) => docs(tag || name)[0],
      modulePathTemplate: (_name, modulePath) => modulePath.replace(/^src\//, 'dist/esm/')
    })
  ]
};
