const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const autoprefixer = require('autoprefixer');

const Dashboard = require('webpack-dashboard');
const DashboardPlugin = require('webpack-dashboard/plugin');
const dashboard = new Dashboard();

const config = {
  debug: true,
  devtool: 'source-map',
  entry: [
    'webpack-dev-server/client?http://0.0.0.0:3001/', // Needed for hot reloading
    'webpack/hot/only-dev-server',
    __dirname + '/../src/js/app/index.js',
    __dirname + '/../src/css/main.less',
  ],
  output: {
    path: __dirname + '/../dist',
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['babel-loader?presets[]=es2015&presets[]=stage-0'],
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
      { test: /\.(png|jpg|gif)$/, loader: 'file-loader' },
      { test: /\.json$/, loader: 'file-loader' },
    ],
  },
  postcss: [ autoprefixer ],
  plugins: [
    new ExtractTextPlugin('bundle.css'),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: __dirname + '/../src/index.ejs',
      inject: false,
      favicon: __dirname + '/../src/img/favicon.ico',
      minify: false,
      appMountId: 'root',
      title: 'Gritos.com',
      unsupportedBrowser: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        // This allows us to overwrite the root domain endpoint that will be used during development run of the application.
        // This environment variable is defined in here: https://github.com/import-io/frontend-utils#api
        // In production this variable will be undefined, the root domain endpoint used to communication with api
        // will be inferred from the current domain name.
        ENDPOINTS_ROOT_DOMAIN: JSON.stringify('gritos.com'),
      },
    }),
    new DashboardPlugin(dashboard.setData),
  ],
  progress: true,
  colors: true,
};

module.exports = config;
