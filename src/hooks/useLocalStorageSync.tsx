import { useEffect, useRef } from 'react';
import { throttle } from 'throttle-debounce';

type StoredValue = {
  value: string | object;
  ttl?: number;
};

const updateStorage = throttle(
  250,
  (key: string, value: string | object, ttl?: number) => {
    const ttlFromNow = ttl && Date.now() + ttl;
    const storedValue: StoredValue = {
      value,
      ttl: ttlFromNow,
    };
    localStorage.setItem(key, JSON.stringify(storedValue));
  }
);

const getFromStorage = (key: string) => {
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  return null;
};

const enforceTTL = (key: string, value: StoredValue) => {
  const now = Date.now();
  if (value.ttl && now > value.ttl) {
    localStorage.removeItem(key);
    return;
  }
  return value;
};

/**
 *
 * @param key localStorage key
 * @param value localStorage value
 * @param onInit Function to call when data is initially loaded from local storage.
 * @param ttl TTL in milliseconds. Note: TTL is enforced on read, so this will not be deleted from
 *            localStorage until the value is read again and TTL has passed.
 * @param manipulateOnInit Function to manipulate data when it's initially loaded from local storage.
 *                         This gives you flexibility to modify stale data in localStorage, for example.
 */
const useLocalStorageSync = (
  key: string,
  value: string | object,
  onInit: (value: any) => void,
  ttl?: number,
  manipulateOnInit?: (value: string | object) => string | object
) => {
  const initialMount = useRef(true);

  useEffect(() => {
    let localData = getFromStorage(key);
    localData = localData && enforceTTL(key, localData);

    if (!localData) {
      onInit(undefined);
      return;
    }

    if (manipulateOnInit && localData.value) {
      localData = manipulateOnInit(localData);
      updateStorage(key, localData.value, localData.ttl);
    }

    onInit(localData.value);
  }, [key]);

  useEffect(() => {
    // The first hook handles reading/updating LS on mount
    if (initialMount.current) {
      return;
    }

    const requestICB = (window as any).requestIdleCallback;

    if (requestICB) {
      requestICB(() => updateStorage(key, value, ttl));
    } else {
      updateStorage(key, value, ttl);
    }
  }, [key, value]);

  useEffect(() => {
    initialMount.current = false;
  }, []);
};

export default useLocalStorageSync;
