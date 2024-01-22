const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const mode = 'production';

module.exports = (env, options) => {
  return merge(common(mode), {
    mode: 'production',
    output: {
      publicPath: process.env.ASSETS_URL,
      filename: '[name].[contenthash].js',
      clean: true
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            compress: {
              drop_console: process.env.MODE == 'production'
            }
          }
        })
      ],
      splitChunks: {
        chunks: 'all'
      }
    },
    module: {
      rules: [
        {
          test: /\.(?:ico|gif|png|jpg|jpeg|svg)$/i,
          loader: 'file-loader',
          options: {
            publicPath: `${process.env.ASSETS_URL}assets/`,
            name: '[path][name].[ext]',
            context: path.resolve(__dirname, 'src/assets'),
            emitFile: false
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'public/index.ejs',
        inject: true,
        filename: 'index.html',

        API_BUCKET: 'API_BUCKET/'
      })
    ]
  });
};
