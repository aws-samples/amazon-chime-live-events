const merge = require('webpack-merge');
const { base, prod } = require('../webpack.shared.js');

module.exports = merge(base('moderator'), prod('Moderator', 'moderator'));
