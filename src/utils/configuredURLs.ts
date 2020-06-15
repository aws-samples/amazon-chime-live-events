interface URLs {
  handRaiseWSSURL: string;
  messagingWSSURL: string;
  baseURL: string;
  broadcasts: {
    HLS: string;
    DASH: string;
    MSS: string;
    CMAF: string;
  };
}

const defaultURLs = {
  baseURL: 'https://hdp2b8cumj.execute-api.us-east-1.amazonaws.com/Prod/',
  handRaiseWSSURL: 'wss://g903wu7l95.execute-api.us-east-1.amazonaws.com/Prod',
  messagingWSSURL: 'wss://4xavicolui.execute-api.us-east-1.amazonaws.com/Prod',
  broadcasts: {
    DASH: '',
    MSS: '',
    CMAF: '',
    HLS:
      'https://usher.ttvnw.net/api/lvs/hls/lvs.693991300569.ross-stream.m3u8?allow_source=true',
  },
};

// Our deployment infra allows us to substitute strings wrapped in ${} with
// parameters from our CloudFormation template. This checks that the
// value was successfully substituted.
function isSubstitutedURL(sub: any) {
  return typeof sub === 'string' && sub[0] !== '$';
}

function isURLs(json: any): json is URLs {
  return (
    json &&
    isSubstitutedURL(json['handRaiseWSSURL']) &&
    isSubstitutedURL(json['messagingWSSURL']) &&
    isSubstitutedURL(json['baseURL'])
  );
}

export function getURLs(): URLs {
  const deployedURLs = (window as any).liveEventsURLs;
  return (isURLs(deployedURLs) && deployedURLs) || defaultURLs;
}

export function getBaseURL(): string {
  return getURLs().baseURL;
}

const LIVE_EVENTS_PATH_FRAGMENT = 'live-events/';

export function getLiveEventsURL(): string {
  return `${getURLs().baseURL}${LIVE_EVENTS_PATH_FRAGMENT}`;
}

export function getHandRaiseWSSURL(): string {
  return getURLs().handRaiseWSSURL;
}

export function getMessagingWSSURL(): string {
  return getURLs().messagingWSSURL;
}
