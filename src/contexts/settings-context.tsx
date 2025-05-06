import React, { createContext, useContext, useState, useEffect } from 'react';
import galaxySound from '../assets/notifications/galaxy_s25_brightline.mp3';
import iphoneSound from '../assets/notifications/iphone_ding.mp3';
import mixkitSound from '../assets/notifications/mixkit-long-pop-2358.wav';
import defaultSound from '../assets/notifications/notification.mp3';

type NotificationSound = 'default' | 'iphone' | 'galaxy' | 'mixkit' | 'none';

interface Settings {
  notifications: {
    enabled: boolean;
    sound: NotificationSound;
    volume: number;
    newMessage: boolean;
    newThread: boolean;
    mentions: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateNotificationSettings: (notificationSettings: Partial<Settings['notifications']>) => void;
  playNotificationSound: () => void;
}

const defaultSettings: Settings = {
  notifications: {
    enabled: true,
    sound: 'default',
    volume: 0.5,
    newMessage: true,
    newThread: true,
    mentions: true,
  },
  theme: 'system',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const getSoundFile = (sound: NotificationSound): string => {
  switch (sound) {
    case 'default':
      return defaultSound;
    case 'iphone':
      return iphoneSound;
    case 'galaxy':
      return galaxySound;
    case 'mixkit':
      return mixkitSound;
    case 'none':
      return '';
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('eclipse-settings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eclipse-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const updateNotificationSettings = (notificationSettings: Partial<Settings['notifications']>) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        ...notificationSettings,
      },
    }));
  };

  const playNotificationSound = () => {
    if (!settings.notifications.enabled || settings.notifications.sound === 'none') {
      return;
    }

    const soundFile = getSoundFile(settings.notifications.sound);
    if (soundFile) {
      const audio = new Audio(soundFile);
      audio.volume = settings.notifications.volume;
      audio.play().catch(error => {
        console.error('Failed to play notification sound:', error);
      });
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateNotificationSettings,
        playNotificationSound,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};