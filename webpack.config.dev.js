const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common');
const path = require('path');
const port = 5009;
const mode = 'development';

module.exports = (env, options) => {
  return merge(common(mode), {
    mode,
    output: {
      publicPath: '/'
    },
    watchOptions: {
      aggregateTimeout: 300,
      poll: 2000, // Seems to stabilise HMR file change detection.
      ignored: '/node_modules/'
    },
    devServer: {
      port,
      historyApiFallback: true,
      https: false,
      server: 'http',
      static: path.join(__dirname, 'dist'),
      hot: true
    },
    module: {
      rules: [
        {
          test: /\.(?:ico|gif|png|jpg|jpeg|svg)$/i,
          loader: 'file-loader',
          options: {
            publicPath: `http://localhost:${port}/assets`,
            name: '[path][name].[ext]',
            context: path.resolve(__dirname, 'src/assets'),
            emitFile: false
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.VERSION': JSON.stringify(0)
      }),
      new HtmlWebpackPlugin({
        template: 'public/index.ejs',
        inject: true,
        filename: 'index.html',

        API_BUCKET: 'API_BUCKET/'
      })
    ]
  });
};
