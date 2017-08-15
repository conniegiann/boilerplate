const path = require('path');
const { DefinePlugin, optimize: { ModuleConcatenationPlugin } } = require('webpack');
const BabiliPlugin = require('babili-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const ROOT = path.join(__dirname, './');
const ENTRY_FILE = path.join(ROOT, './src/js', 'index.js');
const CSS_DIR = path.join(ROOT, './src/scss');
const OUTPUT_DEST = path.join(ROOT, './build');

module.exports = function (options = {}) {
  const {
    // NOTE: By default we're in development mode.
    env = process.env.NODE_ENV || 'development',
  } = options;

  // Comments in css source, or minification of css.
  let minimize = false;

  // Source map generation... switched out in prod.
  let devtool = 'inline-source-map';

  // ECMAScript plugin setup... style text is extracted, compression in prod.
  const plugins = [
    new ExtractTextPlugin('index.css'),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
      'process.env.WEBPACKED': true,
    }),
  ];

  if (env === 'production') {
    devtool = 'hidden-source-map';
    minimize = { discardComments: { removeAll: true } };
    plugins.push(
      new BabiliPlugin({}, { comments: false }),
      new ModuleConcatenationPlugin(),
    );
  }

  return {
    entry: ENTRY_FILE,
    // TODO: Allow for output to be passed as a single string.
    output: {
      filename: 'index.js',
      path: OUTPUT_DEST,
    },
    module: {
      rules: [
        {
          // Style pipeline... node-sass config.
          test: /\.(css|scss)$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                  minimize,
                },
              },
              {
                // TODO: This probably needs sourcemap support.
                loader: "sass-loader" // Compiles scss to css.
              },
            ],
          }),
        },
        {
          // Babel configuration... env and JSX.
          test: /\.(es|js|jsx)$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              /**
               * TODO: We don't need to replicate this here since there's
               * already a `.babelrc` file in the repo. Just import and use
               * that.
               */
              presets: [
                [
                  'env', {
                    targets: {
                      browsers: '> 1%, last 2 versions, Firefox ESR',
                    },
                    modules: false,
                  },
                ],
              ],
              plugins: ['transform-react-jsx'],
            },
          },
        },
      ],
    },
    plugins,
    devtool,
  };
};
