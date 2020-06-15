const regexes = [
  [/^\/attendee(\?.*|\/.*|$)/, 'attendee'],
  [/^\/moderator(\?.*|\/.*|$)/, 'moderator'],
  [/^\/talent(\?.*|\/.*|$)/, 'talent'],
  [/^\/broadcast(\?.*|\/.*|$)/, 'broadcast'],
];

const apps = {
  attendee: '/attendee.html',
  moderator: '/moderator.html',
  talent: '/talent.html',
  broadcast: '/broadcast.html',
};

function invert(object) {
  const out = {};
  for (const [k, v] of Object.entries(object)) {
    out[v] = k;
  }
  return out;
}

// For reverse lookup.
const invertedApps = invert(apps);

const appForOriginPath = (path) => {
  return path &&
         path.length &&
         invertedApps[path];
};

const appForPath = (path) => {
  for (const [re, app] of regexes) {
    if (re.test(path)) {
      return app;
    }
  }
};

module.exports = {
  appForOriginPath,
  appForPath,
  apps,
};