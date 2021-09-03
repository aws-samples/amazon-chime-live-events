const { merge } = require('webpack-merge');
const { base, dev } = require('../webpack.shared.js');

module.exports = merge(base('attendee'), dev('Attendee', 'attendee', 9002));
