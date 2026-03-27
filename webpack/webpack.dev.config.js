const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const autoprefixer = require("autoprefixer");
const HttpsProxyAgent = require("https-proxy-agent");
// const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

// corporate proxy to connect to
const proxyServer = process.env.npm_config_https_proxy;

// const Dashboard = require('webpack-dashboard');
// const DashboardPlugin = require('webpack-dashboard/plugin');
// const dashboard = new Dashboard();
// const OfflinePlugin = require('offline-plugin');
// chunk ordering in html-webpack-plugin
const config = {
  mode: "development",
  devtool: "source-map",
  entry: {
    vendor: ["material-design-lite/material"],
    app: [
      // 'webpack-dev-server/client?http://0.0.0.0:3001/', // Needed for hot reloading
      // 'webpack/hot/only-dev-server',
      __dirname + "/../src/js/app/index.js",
      __dirname + "/../src/css/main.less",
    ],
  },
  output: {
    path: __dirname + "/../dist",
    filename: "[name].js",
    sourceMapFilename: "[file].map",
    chunkFilename: "[id].js",
    publicPath: "/",
  },
  devServer: {
    hot: true, // With hot reloading
    historyApiFallback: true,
    watchFiles: {
      paths: ["src/**/*"],
      options: {
        usePolling: true,
        interval: 1000,
      },
    },
    port: 3001,
    open: false,
    proxy: {
      "/indices": {
        target: "https://gritos.com",
        changeOrigin: true,
        secure: false,
        // logLevel: 'debug',
        toProxy: true,
        // agent: new HttpsProxyAgent(proxyServer),1577
        host: "gritos.com",
        port: "80",
      },
    },
    devMiddleware: {
      stats: "verbose",
    },
  },
  module: {
    rules: [
      {
        loader: "babel-loader",
        test: /\.js$/,
        exclude: /node_modules/,
        options: {
          plugins: ["lodash"],
          presets: [["@babel/preset-env"]],
        },
      },
      // {
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   loaders: ['babel-loader?presets[]=es2015&presets[]=stage-0'],
      // },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
          "less-loader",
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name][ext]",
        },
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name][ext]",
        },
      },
      {
        test: /\.(html)(\?v=[0-9]\.[0-9]\.[0-9])?(\?[0-9]*)?$/,
        loader: "html-loader",
      },
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 10000,
          },
        },
        generator: {
          filename: "images/[name][ext]",
        },
      },
      // {
      //   test: require.resolve('../nod,e_modules/material-design-lite/material.js'),
      // ,  use: 'exports-loader?file,parse=helpers.parse',
      // },
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin({ filename: "bundle.css" }),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: __dirname + "/../src/index.ejs",
      inject: false,
      favicon: __dirname + "/../src/img/favicon.ico",
      minify: false,
      appMountId: "root",
      title: "Gritos.com",
      unsupportedBrowser: false,
      chunks: ["vendor", "app"],
      chunksSortMode: "manual",
    }),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development"),
        // This allows us to overwrite the root domain endpoint that will be used during development run of the application.
        // In production this variable will be undefined, the root domain endpoint used to communication with api
        // will be inferred from the current domain name.
        ENDPOINTS_ROOT_DOMAIN: JSON.stringify("gritos.com"),
      },
    }),
    new webpack.ContextReplacementPlugin(
      /moment[\\\/]locale$/,
      /^\.\/(en|es)$/,
    ),

    // new MomentLocalesPlugin({
    //   localesToKeep: ['es'],
    // }),
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
  resolve: {
    alias: {
      underscore: "lodash",
    },
  },
};

module.exports = config;
