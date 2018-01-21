const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const autoprefixer = require('autoprefixer');
const HttpsProxyAgent = require('https-proxy-agent');

// corporate proxy to connect to
const proxyServer = process.env.npm_config_https_proxy;

// const Dashboard = require('webpack-dashboard');
// const DashboardPlugin = require('webpack-dashboard/plugin');
// const dashboard = new Dashboard();
// const OfflinePlugin = require('offline-plugin');
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
  devtool: 'source-map',
  entry: {
    vendor: [
      'material-design-lite/material',
    ],
    app: [
      // 'webpack-dev-server/client?http://0.0.0.0:3001/', // Needed for hot reloading
      // 'webpack/hot/only-dev-server',
      __dirname + '/../src/js/app/index.js',
      __dirname + '/../src/css/main.less',
    ],

  },
  output: {
    path: __dirname + '/../dist',
    filename: '[name].js',
    sourceMapFilename: '[file].map',
    chunkFilename: '[id].js',
    publicPath: '/',
  },
  devServer: {
    publicPath: '/',
    hot: true, // With hot reloading
    inline: true,
    historyApiFallback: true,
    watchOptions: {
      poll: 1000,
      aggregateTimeout: 1000,
    },
    port: 3001,
    open: false,
    proxy: {
      '/indices': {
        target: 'https://gritos.com',
        changeOrigin: true,
        secure: false,
        // logLevel: 'debug',
        toProxy: true,
        agent: new HttpsProxyAgent(proxyServer),
      },
    },
    stats: 'verbose',
  },
  module: {
    loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['babel-loader?presets[]=es2015&presets[]=stage-0'],
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!postcss-loader!less-loader' }),
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!postcss-loader' }),
      },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'file-loader' },
      { test: /\.(html)(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/, loader: 'html-loader' },
      { test: /\.(png|jpg|gif)$/, loader: 'file-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      // {
      //   test: require.resolve('../node_modules/material-design-lite/material.js'),
      //   use: 'exports-loader?file,parse=helpers.parse',
      // },
    ],
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      options: {
        context: __dirname,
        postcss: [autoprefixer],
        debug: true,
        progress: true,
        colors: true,
      },
    }),
    new ExtractTextPlugin('bundle.css'),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: __dirname + '/../src/index.ejs',
      inject: false,
      favicon: __dirname + '/../src/img/favicon.ico',
      minify: false,
      appMountId: 'root',
      title: 'Gritos.com',
      unsupportedBrowser: false,
      chunksSortMode: packageSort(['vendor', 'app']),
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        // This allows us to overwrite the root domain endpoint that will be used during development run of the application.
        // In production this variable will be undefined, the root domain endpoint used to communication with api
        // will be inferred from the current domain name.
        ENDPOINTS_ROOT_DOMAIN: JSON.stringify('gritos.com'),
      },
    }),
    // new DashboardPlugin(dashboard.setData),
    // new OfflinePlugin({
    //   externals: [
    //     '/',
    //   ].filter(i => i !== false),
    //   rewrites: asset => asset,
    //   ServiceWorker: {
    //     navigateFallbackURL: '/',
    //     publicPath: '/sw.js',
    //   },
    //   AppCache: false,
    //   caches: 'all',
    // }),

  ],
};

module.exports = config;
