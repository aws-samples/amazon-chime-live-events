const { merge } = require('webpack-merge');
const { base, dev } = require('../webpack.shared.js');

module.exports = merge(base('talent'), dev('Talent', 'talent', 9000));
