/* eslint-disable max-params */
import { useRef, useEffect } from 'react';

const useEventListener = (
  eventName: string,
  handler: any,
  element = global,
  options: any = {}
) => {
  const savedHandler = useRef();
  const { capture, passive, once } = options;

  console.log('element', element);

  /**
   *
   */
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  /**
   *
   */
  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) {
      return;
    }

    const eventListener = (event) => {
      //@ts-ignore
      savedHandler.current(event);
    };
    const opts = { capture, passive, once };
    element.addEventListener(eventName, eventListener, opts);
    return () => {
      element.removeEventListener(eventName, eventListener, opts);
    };
  }, [eventName, element, capture, passive, once]);
};

export default useEventListener;
