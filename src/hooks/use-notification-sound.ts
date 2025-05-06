import { useSettings } from '@/contexts/settings-context';
import { useEffect, useRef } from 'react';

export function useNotificationSound() {
  const { settings } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // Update volume when settings change
    audioRef.current.volume = settings.notifications.volume;
  }, [settings.notifications.volume]);

  const playSound = () => {
    if (
      !settings.notifications.enabled ||
      settings.notifications.sound === 'none' ||
      !audioRef.current
    ) {
      return;
    }

    // Get the correct sound file based on settings
    const soundMap = {
      default: '/src/assets/notifications/notification.mp3',
      iphone: '/src/assets/notifications/iphone_ding.mp3',
      galaxy: '/src/assets/notifications/galaxy_s25_brightline.mp3',
      mixkit: '/src/assets/notifications/mixkit-long-pop-2358.wav'
    };

    const soundFile = soundMap[settings.notifications.sound as keyof typeof soundMap];
    if (soundFile) {
      audioRef.current.src = soundFile;
      audioRef.current.play().catch(console.error);
    }
  };

  return { playSound };
}