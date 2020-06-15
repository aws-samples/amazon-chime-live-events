import { useVideoTileState } from '../providers/VideoTileProvider';

const MAX_VIDEOS = 16;

const useIsAtVideoCapacity = () => {
  const { size } = useVideoTileState();

  return size >= MAX_VIDEOS;
};

export default useIsAtVideoCapacity;
