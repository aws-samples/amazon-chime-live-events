import { useEffect } from "react";

export default function useMessageScroll(el: any, messages: any[]) {
  useEffect(() => {
    if (!el || !messages.length) return;

    // (el as HTMLDivElement).scrollIntoView({
    //   behavior: "smooth"
    // });
  }, [el, messages]);
}
