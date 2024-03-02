const { readdir } = require('fs/promises');
const fs = require('fs');
const chokidar = require('chokidar');
const root = './src/components/';

/**
 *
 */
function main() {
  let minify = '';

  getDirectories().then((dir) => {
    dir.forEach((d) => {
      fs.readdir(`${root}${d}`, (err, files) => {
        files.forEach(async (file) => {
          if (file.includes('js')) {
            const fileName = file.split('.')[0];
            const jsPath = `${root}${d}/${fileName}.js`;
            const cssPath = `${root}${d}/${fileName}.css`;

            fs.readFile(jsPath, 'utf8', (err, jsData) => {
              fs.readFile(cssPath, 'utf8', (err, cssData) => {
                if (cssData) {
                  minify += jsData.replace(
                    /(<style\b[^>]*>)[^<>]*(<\/style>)/i,
                    '<style>' + cssData.replace(/\n/g, ' ') + '</style>'
                  );
                } else {
                  minify += jsData;
                }
              });
            });
          }
        });
      });
    });
  });

  setTimeout(() => {
    fs.writeFile('./src/assets/build.min.js', minify, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('The file was saved!');
      }
    });
  }, 3000);
}

/**
 *
 * @returns
 */
const getDirectories = async () =>
  (await readdir(`${root}`, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

chokidar.watch(`${root}`).on('change', main);
