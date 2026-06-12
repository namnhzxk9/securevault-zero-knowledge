import { useEffect } from "react";

type UseAutoLockOptions = {
  isEnabled: boolean;
  timeoutMs: number;
  onLock: () => void;
};

export function useAutoLock({
  isEnabled,
  timeoutMs,
  onLock,
}: UseAutoLockOptions): void {
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    let timeoutId = window.setTimeout(onLock, timeoutMs);

    function resetTimer() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(onLock, timeoutMs);
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer);
    });

    return () => {
      window.clearTimeout(timeoutId);

      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [isEnabled, timeoutMs, onLock]);
}