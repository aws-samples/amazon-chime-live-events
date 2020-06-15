const merge = require('webpack-merge');
const { base, dev } = require('../webpack.shared.js');

console.log('Dev dirname is', __dirname);
module.exports = merge(base('moderator'), dev('Moderator', 'moderator', 9001));
