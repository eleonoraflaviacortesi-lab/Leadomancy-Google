import { useState, useEffect } from 'react';

export interface BannerSettings {
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  bgColor: string;
  textColor: string;
  speed: number;
}

const DEFAULT_SETTINGS: BannerSettings = {
  text1: 'BENVENUTO IN LEADOMANCY',
  text2: 'FATTURATO A CREDITO €{fatturatoCredito}',
  text3: '',
  text4: '',
  bgColor: '#000000',
  textColor: '#FFFFFF',
  speed: 60
};

export function useBannerSettings() {
  const [settings, setSettings] = useState<BannerSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('altair-banner-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing banner settings', e);
      }
    }
    setIsLoading(false);
  }, []);

  const updateSettings = (newSettings: Partial<BannerSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('altair-banner-settings', JSON.stringify(updated));
  };

  return { settings, updateSettings, isLoading };
}
