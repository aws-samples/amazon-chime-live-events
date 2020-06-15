import { useState, useEffect, useLayoutEffect, RefObject } from 'react';
import { debounce } from 'throttle-debounce';
import { ResizeObserver } from 'resize-observer';

function getNamePlateFontSize(width: number) {
  const size = Math.max(1, width / 1000);

  return `${size}rem`;
}

const useDynamicFontSize = (ref: RefObject<HTMLElement>) => {
  const [fontSize, setFontSize] = useState<string>();

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    const { width } = ref.current.getBoundingClientRect();
    setFontSize(getNamePlateFontSize(width));
  }, []);

  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    const handleResize = debounce(50, (entries: any) => {
      const { width } = entries[0].contentRect;
      setFontSize(getNamePlateFontSize(width));
    });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    return () => resizeObserver.unobserve(el);
  }, []);

  return fontSize;
};

export default useDynamicFontSize;
