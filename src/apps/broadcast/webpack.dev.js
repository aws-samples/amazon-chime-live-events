const { merge } = require('webpack-merge');
const { base, dev } = require('../webpack.shared.js');

module.exports = merge(base('broadcast'), dev('Broadcast', 'broadcast', 9003));
