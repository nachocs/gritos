const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');

const STATIC_DOMAIN = process.env.AWS_STATIC_DOMAIN;
const BUILD_NUM = process.env.CIRCLE_BUILD_NUM;

var CDN_BASE_URL = '/'; // eslint-disable-line no-var

if(STATIC_DOMAIN && BUILD_NUM) {
  CDN_BASE_URL = `${STATIC_DOMAIN}/${BUILD_NUM}/`;
} else if(STATIC_DOMAIN) {
  CDN_BASE_URL = `${STATIC_DOMAIN}/`;
}

const config = {
  debug: false,
  entry: [
    __dirname + '/../src/index.js',
    __dirname + '/../src/css/main.less',
  ],
  output: {
    path: __dirname + '/../dist',
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].chunk.js',
    publicPath: CDN_BASE_URL,
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['babel-loader?presets[]=es2015&presets[]=react&presets[]=stage-0'],
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader!less-loader'),
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader'),
      },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'url-loader?limit=10000&minetype=application/font-woff' },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'file-loader' },
      { test: /\.(html)(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'html-loader' },
      { test: /\.(png|jpg|gif)$/, loader: 'url-loader?limit=10000' },
    ],
  },
  postcss: [ autoprefixer ],
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(true),
    // Merge all duplicate modules
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({ // Optimize the JavaScript...
      compress: {
        warnings: false, // ...but do not show warnings in the console (there is a lot of them)
      },
    }),
    new ExtractTextPlugin('[name].[contenthash].css', {
      allChunks: true,
    }),
    new HtmlWebpackPlugin({
      template: __dirname + '/../src/app/index.ejs',
      inject: false,
      favicon: __dirname + '/../src/img/favicon.ico',
      manifest: '/__assets__/manifest.json',
      mobileIcons: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      appMountId: 'root',
      title: 'Gritos.com',
      messagesPath: '/___messages___/messages.js',
      unsupportedBrowser: false,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        ENDPOINTS_ROOT_DOMAIN: JSON.stringify(process.env.ENDPOINTS_ROOT_DOMAIN),
      },
    }),
  ],
  progress: true,
  colors: true,
};

module.exports = config;
