const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'plasma_js_client_dist/index.js'),
  output: {
    path: path.resolve(__dirname),
    filename: 'plasma_js_client.js',
    library: 'plasmaClient',
    libraryTarget: 'window'
  }
};