const CopyPlugin = require('copy-webpack-plugin');
const paths = require('path');

module.exports = (mode) => {
  return {
    entry: './src/index.ts',
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@': paths.resolve(__dirname, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(js|jsx|tsx|ts)$/,
          use: ['babel-loader', 'ts-loader'],
          exclude: /node_modules/
        }
      ]
    },
    optimization: {
      usedExports: true
    },
    plugins: [
      new CopyPlugin({
        patterns: [{ from: './src/assets', to: './assets' }]
      })
    ]
  };
};
