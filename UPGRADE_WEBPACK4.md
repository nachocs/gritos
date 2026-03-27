# Webpack 4 Migration Log

This file records all changes introduced for the "upgrade to webpack 4" task.

## 1) package.json

- webpack: ^4.46.0
- webpack-cli: switched to ^3.3.12 for compatibility with webpack-dev-server@3
- webpack-dev-server: ^3.11.3
- mini-css-extract-plugin: ^0.4.5
- terser-webpack-plugin: ^1.4.5
- html-webpack-plugin: ^4.5.2
- webpack-assets-manifest: ^3.1.1
- css-loader: ^3.6.0
- file-loader: ^6.2.0
- url-loader: ^4.1.1
- html-loader: ^1.3.2
- postcss-loader: ^3.0.0
- less-loader: ^6.2.0
- removed json-loader from dependency list (webpack handles JSON natively)
- offline-plugin removed from production plugin chain (legacy webpack3 UglifyJsPlugin issue)

## 2) webpack/webpack.prod.config.js

- Added `mode: 'production'`.
- Converted old `module.loaders` to `module.rules`.
- Merged CSS/LESS rules to MiniCssExtractPlugin pipeline:
  - MiniCssExtractPlugin.loader
  - css-loader
  - postcss-loader
  - less-loader
- Updated asset rules using modern load syntax (non-legacy callback style).
- Removed explicit `json-loader` rule.
- Replaced custom chunk sorting function with HtmlWebpackPlugin opts:
  - `chunks: ['vendor', 'app']`
  - `chunksSortMode: 'manual'`
- Kept HashedModuleIdsPlugin, LoaderOptionsPlugin, DefinePlugin, ContextReplacementPlugin.

## 3) webpack/webpack.dev.config.js

- Added `mode: 'development'`, `devtool: 'source-map'`.
- Converted module rules same as prod (MiniCssExtractPlugin for styles).
- Removed json-loader rule.
- Updated HtmlWebpackPlugin config as in prod: manual chunk order.

## 4) Build and runtime validation

- `npm install --legacy-peer-deps` succeeded.
- `npm run build` succeeded (dist assets written, no webpack errors).
- `npm run start` succeeded (wdm compiled successfully).
- Controlled earlier issues:
  - `Cannot read properties of undefined` in old chunk sorter fixed with manual chunks
  - `webpack-cli/bin/config-yargs` resolved by using webpack-cli@3
  - `Cannot resolve url-loader` solved by installing url-loader and newer asset loaders
  - `isModuleDeclaration` deprecation warning is from babel plugin-lodash but does not break build
- `npm audit` shows existing vulnerabilities to triage separately.

## 5) Notes

- `offline-plugin` dependency remains in package.json but plugin usage removed from configs as a workaround. Option for future: fully remove or replace with Workbox.
- Future modernization target: webpack 5 + webpack-dev-server 4 + asset modules.
