const { merge } = require('webpack-merge');
const { base, prod } = require('../webpack.shared.js');

module.exports = merge(base('broadcast'), prod('Broadcast', 'broadcast'));
