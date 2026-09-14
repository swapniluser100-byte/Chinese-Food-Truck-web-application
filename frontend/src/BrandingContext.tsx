import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Settings } from "./types";

const DEFAULT_SETTINGS: Settings = { name: "Chinese Food Truck", slogan: null, logo_data_url: null };
const STORAGE_KEY = "branding_cache_v1";

interface BrandingContextValue {
  settings: Settings;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue>({ settings: DEFAULT_SETTINGS, refresh: async () => {} });

function readCache(): Settings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Settings) : null;
  } catch {
    return null;
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readCache() ?? DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    try {
      const { settings } = await api.getSettings();
      setSettings(settings);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // ignore quota errors — cache is best-effort
      }
    } catch {
      // keep whatever we had (cache or defaults) if the fetch fails
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    document.title = settings.name;
  }, [settings.name]);

  return <BrandingContext.Provider value={{ settings, refresh }}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
