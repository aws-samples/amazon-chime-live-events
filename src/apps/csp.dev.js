const cspPlugin = require('csp-html-webpack-plugin');

const options = {
  hashEnabled: {
    // Can't hash because we substitute values in script tag in the html file.
    'script-src': false,
    'style-src': false,
  },
  nonceEnabled: {
    'script-src': false,
    'style-src': false,
  },
};

const self = "'self'";
const unsafeInline = "'unsafe-inline'";

// TODO: different approach to this.
const scriptSrcElem = ['https://s.ytimg.com', 'https://www.youtube.com', 'https://cdn.jsdelivr.net'];

const policy = {
  'default-src': [self],
  // This is for the global var we set in html for endpoints injected at deploy.
  'script-src': [self, unsafeInline].concat(scriptSrcElem),
  'connect-src': [
    // This is insecure. Do not ship with this configuration.
    'https://*.amazonaws.com:*',
    'https://l.chime.aws:*',
    'https://*.app.chime.aws:*',

    'http://localhost:*',

    'ws://localhost:*',
    'wss://*:*',
    'wss://*.app.chime.aws:*',

    // TODO: remove these hard coded values
    'https://www.youtube.com',
    'https://*.us-west-2.playback.live-video.net',
    'https://*.hls.live-video.net',
    'https://usher.ttvnw.net', // only used for the dummie stream
    'https://video-weaver.sea01.hls.ttvnw.net',
    'https://video-weaver.pdx01.hls.ttvnw.net',
  ],
  'img-src': [self, 'blob:'],
  'font-src': [self, 'data:'],
  'media-src': [self, 'blob:', 'data:', 'https://*.us-west-2.playback.live-video.net', ], // TODO remove
  'worker-src': ['blob:'],
  'child-src': ['blob:', 'https://www.youtube.com'], // TODO remove
  'object-src': [self],
};

module.exports = new cspPlugin(policy, options);
