import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useSettings } from '@/hooks/useSettings';

export function ThemeSync() {
  const { settings } = useSettings();
  const { setTheme } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!settings?.theme || hasSynced.current) {
      return;
    }

    setTheme(settings.theme);
    hasSynced.current = true;
  }, [setTheme, settings?.theme]);

  return null;
}
