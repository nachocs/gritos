// const webpack = require('webpack');
const path = require('path');
// const webpackDevServer = require('webpack-dev-server');
const chalk = require('chalk');
const config = require('./webpack.dev.config');

// const PORT = 3001;
// const HOST = '0.0.0.0';

console.log(
  chalk.bold('Options:') +
  chalk.gray('\n-----------------------------------') +
  chalk.cyan('\n       Source: ') + path.join(process.cwd(), 'src') +
  chalk.cyan('\nHot reloading: ') + chalk.green('Enabled') +
  chalk.gray('\n-----------------------------------')
);
console.log('\nStarting server...');

// new webpackDevServer(webpack(config), {
//     publicPath: config.output.publicPath,
//     hot: true, // With hot reloading
//     inline: true,
//     historyApiFallback: true,
//     watchOptions: {
//       poll: 1000,
//       aggregateTimeout: 1000,
//     },
//     port: PORT,
//     open: false,
//     proxy: {
//       '/indices': {
//         target: 'http://gritos.com/indices',
//         // changeOrigin: true,
//       },
//     },
//     stats: 'verbose',
//   })
//   .listen(PORT, HOST, err => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log('Server started ' + chalk.green('✓'));
//       console.log(
//         chalk.bold('\nAccess URLs:') +
//         chalk.gray('\n-----------------------------------') +
//         '\n   Local: ' + chalk.magenta('http://' + HOST + ':' + PORT) +
//         chalk.gray('\n-----------------------------------')
//       );
//       console.log(chalk.red('\nPress ' + chalk.italic('CTRL-C') + ' to stop'));
//     }
//   });

module.exports = config;