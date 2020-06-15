import {
  AudioVideoFacade,
  ConsoleLogger,
  DefaultDeviceController,
  DefaultDOMWebSocketFactory,
  DefaultMeetingSession,
  DefaultModality,
  DefaultPromisedWebSocketFactory,
  DeviceChangeObserver,
  FullJitterBackoff,
  LogLevel,
  MeetingSession,
  MeetingSessionConfiguration,
  ReconnectingPromisedWebSocket,
} from 'amazon-chime-sdk-js';
import React, { ReactNode, useContext, useEffect, useMemo } from 'react';

import { useIntl, IntlShape } from 'react-intl';
import getChimeContext from '../context/getChimeContext';
import DeviceType from '../types/DeviceType';
import FullDeviceInfoType from '../types/FullDeviceInfoType';
import { MessagePayload, Message, MessageType } from '../types/MeetingMessage';
import RegionType from '../types/RegionType';
import RosterType from '../types/RosterType';
import { jsonOrBail } from '../utils/ResponseUtils';
import { getBaseURL, getMessagingWSSURL } from '../utils/configuredURLs';
import { RequestHeadersType } from '../types/RequestHeadersType';
import getCredentialsContext from '../context/getCredentialsContext';
import getLiveEventParticipantContext from '../context/getLiveEventParticipantContext';

export class ChimeSdkWrapper implements DeviceChangeObserver {
  intl: IntlShape;

  private static WEB_SOCKET_TIMEOUT_MS = 10000;

  logger: ConsoleLogger = new ConsoleLogger('SDK', LogLevel.WARN);

  meetingSession: MeetingSession | null = null;

  audioVideo: AudioVideoFacade | null = null;

  deviceController: DefaultDeviceController | null = null;

  title: string | null = null;

  name: string | null = null;

  region: string | null = null;

  supportedChimeRegions: RegionType[] = [
    { label: 'United States (N. Virginia)', value: 'us-east-1' },
    { label: 'Japan (Tokyo)', value: 'ap-northeast-1' },
    { label: 'Singapore', value: 'ap-southeast-1' },
    { label: 'Australia (Sydney)', value: 'ap-southeast-2' },
    { label: 'Canada', value: 'ca-central-1' },
    { label: 'Germany (Frankfurt)', value: 'eu-central-1' },
    { label: 'Sweden (Stockholm)', value: 'eu-north-1' },
    { label: 'Ireland', value: 'eu-west-1' },
    { label: 'United Kingdom (London)', value: 'eu-west-2' },
    { label: 'France (Paris)', value: 'eu-west-3' },
    { label: 'Brazil (São Paulo)', value: 'sa-east-1' },
    { label: 'United States (Ohio)', value: 'us-east-2' },
    { label: 'United States (N. California)', value: 'us-west-1' },
    { label: 'United States (Oregon)', value: 'us-west-2' },
  ];

  currentAudioInputDevice: DeviceType | null = null;

  currentAudioOutputDevice: DeviceType | null = null;

  currentVideoInputDevice: DeviceType | null = null;

  audioInputDevices: DeviceType[] = [];

  audioOutputDevices: DeviceType[] = [];

  videoInputDevices: DeviceType[] = [];

  devicesUpdatedCallbacks: ((
    fullDeviceInfo: FullDeviceInfoType
  ) => void)[] = [];

  roster: RosterType = {};

  rosterUpdateCallbacks: ((roster: RosterType) => void)[] = [];

  configuration: MeetingSessionConfiguration | null = null;

  messagingSocket: ReconnectingPromisedWebSocket | null = null;

  messageUpdateCallbacks: ((message: Message) => void)[] = [];

  requestHeaders: RequestHeadersType | {} = {};

  // Meeting attendeeIds for liveVideoFeeds
  liveAttendeeIds: string[] = [];

  liveAttendeeIdsUpdatesCallbacks: ((attendeeIds: string[]) => void)[] = [];

  private wsStabilizer: any;

  constructor(intl: IntlShape) {
    this.intl = intl;
  }

  private stopWsStabilizer = () => {
    if (!this.wsStabilizer) {
      console.log('No active Websocket to stop!');
    }
    clearInterval(this.wsStabilizer);
  };

  private startWsStabilizer = () => {
    const seconds = 1000 * 60;
    const pingMessage = {
      message: 'ping',
    };
    this.wsStabilizer = setInterval(() => {
      try {
        this.messagingSocket?.send(JSON.stringify(pingMessage));
      } catch (error) {
        console.error('Error sending ping message.');
        this.stopWsStabilizer();
        this.logError(error);
      }
    }, seconds);
  };

  extractJSON = (response: Response): Promise<any> => {
    return jsonOrBail(response, () =>
      this.intl.formatMessage({ id: 'ChimeProvider.serverError' })
    );
  };

  initializeSdkWrapper = async () => {
    this.meetingSession = null;
    this.audioVideo = null;
    this.deviceController = null;
    this.title = null;
    this.name = null;
    this.region = null;
    this.currentAudioInputDevice = null;
    this.currentAudioOutputDevice = null;
    this.currentVideoInputDevice = null;
    this.audioInputDevices = [];
    this.audioOutputDevices = [];
    this.videoInputDevices = [];
    this.roster = {};
    this.rosterUpdateCallbacks = [];
    this.configuration = null;
    this.messagingSocket = null;
    this.messageUpdateCallbacks = [];
  };

  /*
   * ====================================================================
   * regions
   * ====================================================================
   */
  lookupClosestChimeRegion = async (): Promise<RegionType> => {
    let region: string;
    try {
      const response = await fetch(`https://l.chime.aws`, {
        method: 'GET',
      });
      const json = await this.extractJSON(response);
      region = json.region;
    } catch (error) {
      this.logError(error);
    }
    return (
      this.supportedChimeRegions.find(({ value }) => value === region) ||
      this.supportedChimeRegions[0]
    );
  };

  setRequestHeaders = (headers: RequestHeadersType) => {
    this.requestHeaders = headers;
  };

  private getRequestHeaders = (): RequestHeadersType | {} => {
    return this.requestHeaders;
  };

  createRoom = async (
    title: string | null,
    name: string | null,
    region: string | null
  ): Promise<void> => {
    if (!title || !name || !region) {
      throw new Error(
        `To create a meeting, title=${title} name=${name} region=${region} must exist.`
      );
    }

    const url = getBaseURL();
    const response = await fetch(
      `${url}join?title=${encodeURIComponent(title)}&name=${encodeURIComponent(
        name
      )}&region=${encodeURIComponent(region)}`,
      {
        method: 'POST',
        headers: this.getRequestHeaders(),
      }
    );

    const json = await this.extractJSON(response);
    console.log(
      `?title=${encodeURIComponent(title)}&name=${encodeURIComponent(
        name
      )}&region=${encodeURIComponent(region)}`
    );

    const { JoinInfo } = json;
    if (!JoinInfo) {
      throw new Error(
        this.intl.formatMessage({
          id: 'ChimeProvider.meetingDoesNotExist',
        })
      );
    }
    this.configuration = new MeetingSessionConfiguration(
      JoinInfo.Meeting,
      JoinInfo.Attendee
    );
    await this.initializeMeetingSession(this.configuration);

    this.title = title;
    this.name = name;
    this.region = region;
  };

  initializeDeviceController = async (): Promise<DefaultDeviceController> => {
    this.deviceController = new DefaultDeviceController(this.logger);
    return this.deviceController;
  };

  updateDeviceLists = (
    audioInputs: MediaDeviceInfo[],
    audioOutputs: MediaDeviceInfo[],
    videoInputs: MediaDeviceInfo[]
  ): void => {
    this.audioInputDevices = audioInputs.map(
      (mediaDeviceInfo: MediaDeviceInfo) => ({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      })
    );

    this.audioOutputDevices = audioOutputs.map(
      (mediaDeviceInfo: MediaDeviceInfo) => ({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      })
    );

    this.videoInputDevices = videoInputs.map(
      (mediaDeviceInfo: MediaDeviceInfo) => ({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      })
    );
  };

  initializeMeetingSession = async (
    configuration: MeetingSessionConfiguration
  ): Promise<void> => {
    this.meetingSession = new DefaultMeetingSession(
      configuration,
      this.logger,
      await this.initializeDeviceController()
    );
    this.audioVideo = this.meetingSession.audioVideo;

    // Set the camera video to 720p at 30fps using at most 2.8Mbit
    this.audioVideo.chooseVideoInputQuality(1280, 720, 30, 2800);

    const audioInputDevices =
      (await this.audioVideo?.listAudioInputDevices()) || [];
    const audioOutputDevices =
      (await this.audioVideo?.listAudioOutputDevices()) || [];
    const videoInputDevices =
      (await this.audioVideo?.listVideoInputDevices()) || [];

    this.updateDeviceLists(
      audioInputDevices,
      audioOutputDevices,
      videoInputDevices
    );

    this.publishDevicesUpdated();
    this.audioVideo?.addDeviceChangeObserver(this);

    this.audioVideo?.realtimeSubscribeToAttendeeIdPresence(
      async (
        presentAttendeeId: string,
        present: boolean,
        externalUserId?: string | null
      ) => {
        if (!present) {
          delete this.roster[presentAttendeeId];
          this.publishRosterUpdate();
          return;
        }

        const baseAttendeeId = new DefaultModality(presentAttendeeId).base();
        if (baseAttendeeId !== presentAttendeeId) {
          return;
        }

        if (!this.roster[presentAttendeeId]) {
          this.roster[presentAttendeeId] = {
            name: '',
            id: presentAttendeeId,
            liveEventAttendeeId: externalUserId || '',
          };
        }

        if (
          this.title &&
          presentAttendeeId &&
          !this.roster[presentAttendeeId].name
        ) {
          const url = getBaseURL();
          const response = await fetch(
            `${url}attendee?title=${encodeURIComponent(
              this.title
            )}&attendee=${encodeURIComponent(presentAttendeeId)}`,
            {
              method: 'GET',
              headers: this.getRequestHeaders(),
            }
          );
          const json = await this.extractJSON(response);
          this.roster[presentAttendeeId].name = json.AttendeeInfo.Name || '';
        }
        this.publishRosterUpdate();
      }
    );
  };

  listAndSelectDevices = async (): Promise<void> => {
    const audioInputs =
      (await this.deviceController?.listAudioInputDevices()) || [];
    const audioOutputs =
      (await this.deviceController?.listAudioOutputDevices()) || [];
    const videoInputs =
      (await this.deviceController?.listVideoInputDevices()) || [];

    this.updateDeviceLists(audioInputs, audioOutputs, videoInputs);

    if (
      !this.currentAudioInputDevice &&
      audioInputs.length &&
      audioInputs[0].deviceId
    ) {
      this.currentAudioInputDevice = {
        label: audioInputs[0].label,
        value: audioInputs[0].deviceId,
      };
      await this.deviceController?.chooseAudioInputDevice(
        audioInputs[0].deviceId
      );
    }

    if (
      !this.currentAudioOutputDevice &&
      audioOutputs.length &&
      audioOutputs[0].deviceId
    ) {
      this.currentAudioOutputDevice = {
        label: audioOutputs[0].label,
        value: audioOutputs[0].deviceId,
      };
      await this.deviceController?.chooseAudioOutputDevice(
        audioOutputs[0].deviceId
      );
    }

    if (
      !this.currentVideoInputDevice &&
      videoInputs.length &&
      videoInputs[0].deviceId
    ) {
      this.currentVideoInputDevice = {
        label: videoInputs[0].label,
        value: videoInputs[0].deviceId,
      };
      await this.deviceController?.chooseVideoInputDevice(
        videoInputs[0].deviceId
      );
    }

    this.publishDevicesUpdated();
  };

  joinRoom = async (element: HTMLAudioElement | null): Promise<void> => {
    if (!element) {
      this.logError(new Error(`element does not exist`));
      return;
    }

    window.addEventListener(
      'unhandledrejection',
      (event: PromiseRejectionEvent) => {
        this.logError(event.reason);
      }
    );

    await this.listAndSelectDevices();

    this.audioVideo?.bindAudioElement(element);
    this.audioVideo?.start();
  };

  joinRoomMessaging = async (): Promise<void> => {
    if (!this.configuration) {
      this.logError(new Error('configuration does not exist'));
      return;
    }
    const headers = this.getRequestHeaders() as RequestHeadersType;

    const messagingWSSURL = getMessagingWSSURL();

    /*
    Encode token and attendeeId to pass as query params since WS not
    supporting sending custom headers from browsers.
    */
    const encodedAuthPayload = window.btoa(JSON.stringify(headers));

    const messagingUrl = `${messagingWSSURL}?Authorization=${encodedAuthPayload}&MeetingId=${this.configuration.meetingId}&AttendeeId=${this.configuration.credentials?.attendeeId}&JoinToken=${this.configuration.credentials?.joinToken}`;
    this.messagingSocket = new ReconnectingPromisedWebSocket(
      messagingUrl,
      [],
      'arraybuffer',
      new DefaultPromisedWebSocketFactory(new DefaultDOMWebSocketFactory()),
      new FullJitterBackoff(1000, 0, 10000)
    );

    this.messagingSocket.addEventListener('open', () => {
      if (this.configuration?.credentials?.attendeeId) {
        const payload: MessagePayload = {
          targetAttendeeId: this.configuration?.credentials?.attendeeId,
        };
        // Initiate WS stabilizer
        this.startWsStabilizer();

        this.sendMessage(MessageType.INIT_ATTENDEE, payload);
      } else {
        this.logError(new Error('Missing configuration attributes'));
      }
    });

    await this.messagingSocket.open(ChimeSdkWrapper.WEB_SOCKET_TIMEOUT_MS);

    window.addEventListener('beforeunload', () => {
      this.stopWsStabilizer();
      console.debug('Closing messaging socket.');
      this.messagingSocket?.close(500, 1000, 'Unload').then(() => {
        console.debug('Closed messaging socket.');
      });
    });

    this.messagingSocket.addEventListener('message', (event: Event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        // Do not process ping messages.
        if (data?.type === 'ping') return;

        const { attendeeId } = data.payload;

        let name;
        if (this.roster[attendeeId]) {
          name = this.roster[attendeeId].name;
        }

        this.publishMessageUpdate({
          type: data.type,
          payload: data.payload,
          timestampMs: Date.now(),
          name,
        });
      } catch (error) {
        this.logError(error);
      }
    });
  };

  // eslint-disable-next-line
  sendMessage = (type: MessageType, payload: MessagePayload) => {
    if (!this.messagingSocket) {
      return;
    }
    const message = {
      message: 'sendmessage',
      data: JSON.stringify({ type, payload }),
    };
    try {
      this.messagingSocket.send(JSON.stringify(message));
    } catch (error) {
      this.logError(error);
    }
  };

  kickAttendee = async (attendeeId: string) => {
    try {
      if (!this.title || !attendeeId) {
        return;
      }

      const base = getBaseURL();
      const url = `${base}live-events/${this.title}/kick`;

      await fetch(url, {
        method: 'POST',
        headers: this.getRequestHeaders(),
        body: JSON.stringify({
          attendeeId,
          title: this.title,
        }),
      });
    } catch (error) {
      this.logError(error);
    }
  };

  leaveRoom = async (end: boolean): Promise<void> => {
    try {
      await this.dropAudio();
      await this.dropVideo();
      this.audioVideo?.stop();
    } catch (error) {
      this.logError(error);
    }

    try {
      await this.messagingSocket?.close(ChimeSdkWrapper.WEB_SOCKET_TIMEOUT_MS);
    } catch (error) {
      console.error('Unable to send close message on messaging socket.');
      this.logError(error);
    }

    try {
      if (end && this.title) {
        const base = getBaseURL();
        await fetch(`${base}end?title=${encodeURIComponent(this.title)}`, {
          method: 'POST',
          headers: this.getRequestHeaders(),
        });
      }
    } catch (error) {
      this.logError(error);
    }

    this.initializeSdkWrapper();
  };

  /**
   * ====================================================================
   * Device
   * ====================================================================
   */

  chooseAudioInputDevice = async (device: DeviceType) => {
    try {
      await this.deviceController?.chooseAudioInputDevice(device.value);
      this.currentAudioInputDevice = device;
      this.publishDevicesUpdated();
    } catch (error) {
      this.logError(error);
    }
  };

  chooseAudioOutputDevice = async (device: DeviceType) => {
    try {
      await this.deviceController?.chooseAudioOutputDevice(device.value);
      this.currentAudioOutputDevice = device;
      this.publishDevicesUpdated();
    } catch (error) {
      this.logError(error);
    }
  };

  chooseVideoInputDevice = async (device: DeviceType) => {
    try {
      await this.deviceController?.chooseVideoInputDevice(device.value);
      this.currentVideoInputDevice = device;
      this.publishDevicesUpdated();
    } catch (error) {
      this.logError(error);
    }
  };

  /**
   * Call this when you want the camera/mic indicators to stop flashing red.
   */
  dropVideo = async () => {
    await this.audioVideo?.chooseVideoInputDevice(null);
  };

  dropAudio = async () => {
    this.audioVideo?.unbindAudioElement();
    await this.audioVideo?.chooseAudioInputDevice(null);
  };

  disableVideoAndLeaveRoom = async (end: boolean = false) => {
    if (!this.audioVideo) {
      return;
    }

    const av = this.audioVideo;
    console.debug('Disabling video.');

    try {
      await av.stopLocalVideoTile();
      console.debug('Stopped tile');
    } catch (error) {
      console.error('Error stopping local video.');
      this.logError(error);
    }

    try {
      await av.chooseVideoInputDevice(null);
    } catch (error) {
      console.error('Error discarding video input.');
      this.logError(error);
    }

    try {
      console.log(
        `Leaving ${end ? 'and ending ' : ''} meeting with ID ${
          this.configuration?.meetingId
        }`
      );
      await this.leaveRoom(end);
    } catch (error) {
      console.error('Error leaving room after stopping local video.');
      this.logError(error);
    }
  };

  /**
   * ====================================================================
   * Observer methods
   * ====================================================================
   */

  audioInputsChanged(freshAudioInputDeviceList: MediaDeviceInfo[]): void {
    let hasCurrentDevice = false;
    this.audioInputDevices = [];
    freshAudioInputDeviceList.forEach((mediaDeviceInfo: MediaDeviceInfo) => {
      if (
        this.currentAudioInputDevice &&
        mediaDeviceInfo.deviceId === this.currentAudioInputDevice.value
      ) {
        hasCurrentDevice = true;
      }
      this.audioInputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentAudioInputDevice =
        this.audioInputDevices.length > 0 ? this.audioInputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  audioOutputsChanged(freshAudioOutputDeviceList: MediaDeviceInfo[]): void {
    let hasCurrentDevice = false;
    this.audioOutputDevices = [];
    freshAudioOutputDeviceList.forEach((mediaDeviceInfo: MediaDeviceInfo) => {
      if (
        this.currentAudioOutputDevice &&
        mediaDeviceInfo.deviceId === this.currentAudioOutputDevice.value
      ) {
        hasCurrentDevice = true;
      }
      this.audioOutputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentAudioOutputDevice =
        this.audioOutputDevices.length > 0 ? this.audioOutputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  videoInputsChanged(freshVideoInputDeviceList: MediaDeviceInfo[]): void {
    let hasCurrentDevice = false;
    this.videoInputDevices = [];
    freshVideoInputDeviceList.forEach((mediaDeviceInfo: MediaDeviceInfo) => {
      if (
        this.currentVideoInputDevice &&
        mediaDeviceInfo.deviceId === this.currentVideoInputDevice.value
      ) {
        hasCurrentDevice = true;
      }
      this.videoInputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentVideoInputDevice =
        this.videoInputDevices.length > 0 ? this.videoInputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  /**
   * ====================================================================
   * Subscribe and unsubscribe from SDK events
   * ====================================================================
   */

  subscribeToDevicesUpdated = (
    callback: (fullDeviceInfo: FullDeviceInfoType) => void
  ) => {
    this.devicesUpdatedCallbacks.push(callback);
  };

  unsubscribeFromDevicesUpdated = (
    callback: (fullDeviceInfo: FullDeviceInfoType) => void
  ) => {
    const index = this.devicesUpdatedCallbacks.indexOf(callback);
    if (index !== -1) {
      this.devicesUpdatedCallbacks.splice(index, 1);
    }
  };

  private publishDevicesUpdated = () => {
    this.devicesUpdatedCallbacks.forEach(
      (callback: (fullDeviceInfo: FullDeviceInfoType) => void) => {
        callback({
          currentAudioInputDevice: this.currentAudioInputDevice,
          currentAudioOutputDevice: this.currentAudioOutputDevice,
          currentVideoInputDevice: this.currentVideoInputDevice,
          audioInputDevices: this.audioInputDevices,
          audioOutputDevices: this.audioOutputDevices,
          videoInputDevices: this.videoInputDevices,
        });
      }
    );
  };

  subscribeToRosterUpdate = (callback: (roster: RosterType) => void) => {
    this.rosterUpdateCallbacks.push(callback);
  };

  unsubscribeFromRosterUpdate = (callback: (roster: RosterType) => void) => {
    const index = this.rosterUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.rosterUpdateCallbacks.splice(index, 1);
    }
  };

  private publishRosterUpdate = () => {
    for (let i = 0; i < this.rosterUpdateCallbacks.length; i += 1) {
      const callback = this.rosterUpdateCallbacks[i];
      callback(this.roster);
    }
  };

  subscribeToMessageUpdate = (callback: (message: Message) => void) => {
    this.messageUpdateCallbacks.push(callback);
  };

  unsubscribeFromMessageUpdate = (callback: (message: Message) => void) => {
    const index = this.messageUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.messageUpdateCallbacks.splice(index, 1);
    }
  };

  private publishMessageUpdate = (message: Message) => {
    for (let i = 0; i < this.messageUpdateCallbacks.length; i += 1) {
      const callback = this.messageUpdateCallbacks[i];
      callback(message);
    }
  };

  /**
   * ====================================================================
   * Utilities
   * ====================================================================
   */
  private logError = (error: Error) => {
    // eslint-disable-next-line
    console.error(error);
  };
}

type Props = {
  children: ReactNode;
};

export default function ChimeProvider(props: Props) {
  const { children } = props;
  const intl = useIntl();
  const chimeSdkWrapper = useMemo(() => new ChimeSdkWrapper(intl), [intl]);
  const ChimeContext = getChimeContext();

  const credentials = useContext(getCredentialsContext());

  // TODO this provider is really high in our component tree, so we need
  // to move a bit of stuff around to get it to be able to use an
  // Active or VerifiedParticipantProvider.
  const liveEventParticipant = useContext(getLiveEventParticipantContext());

  const setHeaders = (): void => {
    if (credentials.authToken && liveEventParticipant.attendeeId) {
      const requestHeaders = {
        Authorization: credentials.authToken,
        AttendeeId: liveEventParticipant.attendeeId,
      } as RequestHeadersType;

      chimeSdkWrapper.setRequestHeaders(requestHeaders);
    }
  };

  // Set headers before child components renders.
  setHeaders();

  // Update headers when dependencies change.
  useEffect(() => {
    setHeaders();
  }, [credentials, liveEventParticipant]);

  return (
    <ChimeContext.Provider value={chimeSdkWrapper}>
      {children}
    </ChimeContext.Provider>
  );
}
