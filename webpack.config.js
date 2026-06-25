/**
 * webpack.config.js
 *
 * Key alias: 'react-native' → 'react-native-web'
 *
 * mainFields fix: prefer 'main' (CJS) over 'module' (ESM).
 * @react-navigation/* ships both; the ESM lib/module/ version
 * contains legacy `exports` references that cause
 * "exports is not defined" in the browser. CJS is safe.
 */

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './index.web.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },

  devServer: {
    static: path.resolve(__dirname, 'public'),
    port: 3000,
    hot: true,
    historyApiFallback: true,
    open: true,
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            configFile: false,
            presets: [
              ['module:@react-native/babel-preset', {disableImportExportTransform: true}],
            ],
            plugins: ['react-native-web'],
          },
        },
        resolve: {
          fullySpecified: false,
        },
        exclude: /node_modules\/(?!(react-native|@react-native|@react-navigation|react-native-web|react-native-safe-area-context|@react-native-async-storage|@react-native-community|react-native-gesture-handler|react-native-screens)[\\/]).*/,
      },
      {
        test: /\.(png|jpg|gif|svg|ttf|woff|woff2)$/,
        type: 'asset/resource',
      },
    ],
  },

  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.jsx'],

    // Restore standard mainFields for web (Webpack will choose module over main automatically)
    mainFields: ['browser', 'module', 'main'],

    alias: {
      'react-native$': 'react-native-web',
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    // Suppress optional Reanimated dependency warnings from gesture-handler
    new webpack.IgnorePlugin({resourceRegExp: /^react-native-reanimated$/}),
    new webpack.IgnorePlugin({resourceRegExp: /^react-native-worklets$/}),
  ],
};
