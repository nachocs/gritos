const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const OfflinePlugin = require('offline-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

const STATIC_DOMAIN = '';
const BUILD_NUM = require('../package.json').version;

var CDN_BASE_URL = '/'; // eslint-disable-line no-var

// if(STATIC_DOMAIN && BUILD_NUM) {
// CDN_BASE_URL = `${STATIC_DOMAIN}/${BUILD_NUM}/`;
// } else if(STATIC_DOMAIN) {
CDN_BASE_URL = `${STATIC_DOMAIN}/`;
// }
// const __dirname = '';

function packageSort(packages) {
  // packages = ['polyfills', 'vendor', 'app']
  const len = packages.length - 1;
  const first = packages[0];
  const last = packages[len];
  return function sort(a, b) {
    // polyfills always first
    if (a.names[0] === first) {
      return -1;
    }
    // app always last
    if (a.names[0] === last) {
      return 1;
    }
    // vendor before app
    if (a.names[0] !== first && b.names[0] === last) {
      return -1;
    } else {
      return 1;
    }
  };
}

const config = {
  entry: {
    vendor: [
      'material-design-lite/material',
    ],
    app: [
      __dirname + '/../src/js/app/index.js',
      __dirname + '/../src/css/main.less',
    ],

  },
  output: {
    path: __dirname + '/../dist',
    filename: 'dist/' + BUILD_NUM + '/[name].[chunkhash].js',
    chunkFilename: 'dist/' + BUILD_NUM + '/[name].[chunkhash].chunk.js',
    publicPath: CDN_BASE_URL,
  },
  module: {
    loaders: [{
        'loader': 'babel-loader',
        'test': /\.js$/,
        'exclude': /node_modules/,
        'query': {
          'plugins': ['lodash'],
          'presets': [
            ['@babel/preset-env'],
          ],
        },
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!postcss-loader!less-loader' }),
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!postcss-loader' }),
      },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'url-loader?limit=10000&minetype=application/font-woff&name=dist/' + BUILD_NUM + '/fonts/[name].[ext]' },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'file-loader?name=dist/' + BUILD_NUM + '/fonts/[name].[ext]' },
      { test: /\.(html)(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'html-loader' },
      { test: /\.(png|jpg|gif)$/, loader: 'url-loader?limit=10000' },
      { test: /\.json$/, loader: 'json-loader' },
      // {
      //   test: require.resolve('../node_modules/material-design-lite/material.js'),
      //   use: 'exports-loader?file,parse=helpers.parse',
      // },
    ],
  },
  plugins: [
    new webpack.HashedModuleIdsPlugin(),
    // new BundleAnalyzerPlugin(),
    new webpack.LoaderOptionsPlugin({
      options: {
        context: __dirname,
        postcss: [autoprefixer],
        debug: true,
        progress: true,
        colors: true,
      },
    }),
    new webpack.optimize.OccurrenceOrderPlugin(true),
    // Merge all duplicate modules
    new webpack.optimize.UglifyJsPlugin({ // Optimize the JavaScript...
      compress: {
        warnings: false, // do not show warnings in the console
        drop_console: true,
        drop_debugger: true,
      },
    }),
    new ExtractTextPlugin({
      filename: 'dist/' + BUILD_NUM + '/[name].[contenthash].css',
      disable: false,
      allChunks: true,
    }),
    new HtmlWebpackPlugin({
      template: __dirname + '/../src/index.ejs',
      inject: false,
      favicon: __dirname + '/../src/assets/favicon.ico',
      manifest: '/manifest.json',
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
      unsupportedBrowser: false,
      chunksSortMode: packageSort(['vendor', 'app']),
    }),
    new WebpackAssetsManifest({
      output: 'manifest.json',
      assets: {
        'name': 'Gritos.com',
        'short_name': 'Gritos.com',
        'start_url': 'https://gritos.com',
        'theme_color': 'white',
        'display': 'standalone',
        'background_color': 'white',
        'description': 'Expresa libremente y sin ningún tipo de tapujos tu opinión sobre el tema que quieras.',
        'version': JSON.stringify(require('../package.json').version),
        'icons': [{
            'src': '/assets/android-icon-36x36.png',
            'sizes': '36x36',
            'type': 'image/png',
            'density': '0.75',
          },
          {
            'src': '/assets/android-icon-48x48.png',
            'sizes': '48x48',
            'type': 'image/png',
            'density': '1.0',
          },
          {
            'src': '/assets/android-icon-72x72.png',
            'sizes': '72x72',
            'type': 'image\/png',
            'density': '1.5',
          },
          {
            'src': '/assets/android-icon-96x96.png',
            'sizes': '96x96',
            'type': 'image/png',
            'density': '2.0',
          },
          {
            'src': '/assets/android-icon-144x144.png',
            'sizes': '144x144',
            'type': 'image\/png',
            'density': '3.0',
          },
          {
            'src': '/assets/android-icon-192x192.png',
            'sizes': '192x192',
            'type': 'image/png',
            'density': '4.0',
          },
          {
            'src': '/assets/android-icon-256x256.png',
            'sizes': '256x256',
            'type': 'image/png',
          },
          {
            'src': '/assets/android-icon-384x384.png',
            'sizes': '384x384',
            'type': 'image/png',
          },
          {
            'src': '/assets/android-icon-512x512.png',
            'sizes': '512x512',
            'type': 'image/png',
          },
        ],
      },
      replacer: null,
      space: 2,
      writeToDisk: true,
      fileExtRegex: /\.\w{2,4}\.(?:map|gz)$|\.\w+$/i,
      sortManifest: true,
      merge: false,
      publicPath: '',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        ENDPOINTS_ROOT_DOMAIN: JSON.stringify(process.env.ENDPOINTS_ROOT_DOMAIN),
        VERSION: JSON.stringify(require('../package.json').version),
      },
    }),
    new OfflinePlugin({
      externals: [
        '/',
      ].filter(i => i !== false),
      rewrites: asset => asset,
      ServiceWorker: {
        navigateFallbackURL: '/',
        publicPath: '/sw.js',
      },
      AppCache: false,
      caches: 'all',
    }),
    new webpack.ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(en|es)$/),
    // new MomentLocalesPlugin({
    //   localesToKeep: ['es'],
    // }),
  ],
  'resolve': {
    'alias': {
      'underscore': 'lodash',
    },
  },
};

module.exports = config;