const { merge } = require('webpack-merge');
const { base, prod } = require('../webpack.shared.js');

module.exports = merge(base('talent'), prod('Talent', 'talent'));
