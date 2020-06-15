import React, { useEffect, useLayoutEffect, createRef, useState } from 'react';
import classNames from 'classnames/bind';
import { debounce } from 'throttle-debounce';
import { ResizeObserver } from 'resize-observer';

import styles from './VideoGrid.css';
const cx = classNames.bind(styles);

function getAspectRatio(height: number, width: number) {
  const aspectRatio = width / height;

  if (aspectRatio > 36 / 9) {
    return 'r36by9';
  }
  if (aspectRatio > 29 / 9) {
    return 'r29by9';
  }
  if (aspectRatio > 21 / 9) {
    return 'r21by9';
  }
  if (aspectRatio > 16 / 9) {
    return 'r16by9';
  }
  if (aspectRatio > 3 / 2) {
    return 'r3by2';
  }
  if (aspectRatio > 4 / 3) {
    return 'r4by3';
  }
  if (aspectRatio > 1) {
    return 'r1by1';
  }
  if (aspectRatio > 2 / 3) {
    return 'r2by3';
  }

  return 'slim';
}

interface Props {
  size: number;
  className?: string;
}

const VideoGrid: React.FC<Props> = ({ children, size, className }) => {
  const gridEl = createRef<HTMLDivElement>();
  const [ratio, setRatio] = useState<any>();

  useLayoutEffect(() => {
    if (!gridEl.current) {
      return;
    }

    const { height, width } = gridEl.current?.getBoundingClientRect();
    setRatio(getAspectRatio(height, width));
  }, []);

  useEffect(() => {
    const el = gridEl.current;

    if (!el) {
      return;
    }

    const handleResize = debounce(100, (entries: any) => {
      const { height, width } = entries[0].contentRect;
      setRatio(getAspectRatio(height, width));
    });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    return () => resizeObserver.unobserve(el);
  }, []);

  return (
    <div
      ref={gridEl}
      className={cx('grid', `grid--size-${size}`, ratio, className)}
    >
      {children}
    </div>
  );
};

export default VideoGrid;
