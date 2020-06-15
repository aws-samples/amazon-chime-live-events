export interface ContentState {
  activeContentTileId: number | null;
  isRemoteUserSharing: boolean;
  isLocalUserSharing: boolean;
  isLocalShareLoading: boolean;
  isSomeoneSharing: boolean;
}

export const initialState: ContentState = {
  activeContentTileId: null,
  isRemoteUserSharing: false,
  isLocalUserSharing: false,
  isLocalShareLoading: false,
  isSomeoneSharing: false,
};
