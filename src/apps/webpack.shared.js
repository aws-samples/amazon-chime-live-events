const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

console.log('Shared dirname is', __dirname);
console.log('Template:', path.join(__dirname, '../index.html'));
console.log('Prod path:', path.join(__dirname, '../../dist'));

module.exports = {
  dev: (title, filename, port) => ({
    mode: 'development',
    output: {
      path: path.join(__dirname, '../../public'),
      publicPath: '/',
      filename: `${filename}.js`,
    },
    devtool: 'source-map',
    plugins: [
      require('./csp.dev'),
      new HtmlWebpackPlugin({
        title: `${title}`,
        filename: `${filename}.html`,
        template: path.join(__dirname, '../index.html'),
      }),
      new webpack.DefinePlugin({
        'process.env.PLAIN_HMR': false,
     })
    ],
    devServer: {
      devMiddleware: {
        writeToDisk: true,
      },
      static: {
        directory: path.resolve(__dirname, 'src'),
      },
      liveReload: true,
      historyApiFallback: true,
      port,
    },
  }),

  prod: (title, filename) => ({
    mode: 'production',
    watch: false,
    output: {
      path: path.join(__dirname, '../../dist'),
      publicPath: '/',
      filename: `${filename}.[contenthash].js`,
    },
    plugins: [
      require('./csp.prod'),
      new HtmlWebpackPlugin({
        title: `${title}`,
        filename: `${filename}.html`,
        template: path.join(__dirname, '../index.html'),
      }),
      new webpack.DefinePlugin({
        'process.env.PLAIN_HMR': false,
     })
    ],
  }),

  base: (app) => ({
    entry: `${__dirname}/${app}/index.tsx`,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.global\.css$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /^((?!\.global).)*\.css$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]__[local]__[hash:base64:5]',
                },
                sourceMap: true,
                importLoaders: 1,
              },
            },
          ],
        },
        // SASS support - compile all .global.scss files and pipe it to style.css
        {
          test: /\.global\.(scss|sass)$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            },
            {
              loader: 'sass-loader',
            },
          ],
        },
        // SASS support - compile all other .scss files and pipe it to style.css
        {
          test: /^((?!\.global).)*\.(scss|sass)$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]__[local]__[hash:base64:5]',
                },
                sourceMap: true,
                importLoaders: 1,
              },
            },
            {
              loader: 'sass-loader',
            },
          ],
        },
        // WOFF Font
        {
          test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/font-woff',
            },
          },
        },
        // WOFF2 Font
        {
          test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/font-woff',
            },
          },
        },
        // TTF Font
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/octet-stream',
            },
          },
        },
        // EOT Font
        {
          test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
          use: 'file-loader',
        },
        // SVG Font
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'image/svg+xml',
            },
          },
        },
        // Common Image Formats
        {
          test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
          use: 'url-loader',
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
  }),
};
