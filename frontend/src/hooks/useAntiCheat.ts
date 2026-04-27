import { useEffect, useRef, useState } from 'react';
import { studentApi } from '../services/api';
import { getSocket } from '../services/socketClient';

export function useAntiCheat(testSessionId: string | null, enabled: boolean) {
  const lastViolation = useRef<number>(0);
  const [fatalStrike, setFatalStrike] = useState(0);
  const [isFullscreenExit, setIsFullscreenExit] = useState(false);

  useEffect(() => {
    if (!enabled || !testSessionId) return;

    const reportViolation = async (type: 'tab-switch' | 'focus-loss' | 'fullscreen-exit') => {
      const now = Date.now();
      if (now - lastViolation.current < 1500) return;
      lastViolation.current = now;

      const isFatal = type !== 'fullscreen-exit';
      console.log(`[AntiCheat] Detected ${type}. Fatal: ${isFatal}`);

      if (isFatal) {
        setFatalStrike((prev: number) => {
          const next = prev + 1;
          emitViolation(next, true);
          return next;
        });
      } else {
        setIsFullscreenExit(true);
        emitViolation(0, false);
      }

      async function emitViolation(count: number, isFatal: boolean) {
        // Notify server via REST
        try {
          await studentApi.reportTabSwitch(testSessionId!);
        } catch { }

        // Notify server via Socket
        const socket = getSocket();
        if (socket?.connected) {
          console.log(`[AntiCheat] Emitting security_violation to server...`);
          socket.emit('security_violation', {
            testSessionId,
            violationType: type,
            strikeCount: count,
            isFatal,
            timestamp: new Date()
          });
        } else {
          console.warn('[AntiCheat] Socket not connected, could not emit violation');
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) reportViolation('tab-switch');
    };

    const handleBlur = () => {
      reportViolation('focus-loss');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreenExit(true);
        reportViolation('fullscreen-exit');
      } else {
        setIsFullscreenExit(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [testSessionId, enabled]);

  return { fatalStrike, isFullscreenExit };
}
