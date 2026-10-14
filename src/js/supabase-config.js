/**
 * NEXCHAT Supabase Configuration & Credentials Manager
 * Allows runtime configuration via localStorage, UI modal, or environment settings.
 */

export const SUPABASE_DEFAULTS = {
  url: 'https://ohsrsevoudwttudpvtpu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oc3JzZXZvdWR3dHR1ZHB2dHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODgyMTUsImV4cCI6MjEwNjg2NDIxNX0.j5xCe7U2NCqVAEEPc6d40WIGKpbfRFj81RVueDkO4IU',
  publishableKey: 'sb_publishable_nYCpNXPPn6irP_fe4sYPww_-246rL81',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oc3JzZXZvdWR3dHR1ZHB2dHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI4ODIxNSwiZXhwIjoyMTA2ODY0MjE1fQ.j5EbODk5vW60ufPcaxoi12TKJCm3Suiq6RJ3yzRcxhE',
};

export function getActiveSupabaseSettings() {
  if (typeof window !== 'undefined') {
    if (window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey) {
      return { ...window.SUPABASE_CONFIG, active: true };
    }
    try {
      const stored = localStorage.getItem('nexchat_supabase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey && !parsed.url.includes('demo-nexchat')) {
          return { ...parsed, active: true };
        }
      }
    } catch {}
  }
  const hasValidDefault = Boolean(SUPABASE_DEFAULTS.url && SUPABASE_DEFAULTS.anonKey && !SUPABASE_DEFAULTS.url.includes('demo-nexchat'));
  return { ...SUPABASE_DEFAULTS, active: hasValidDefault };
}

export function saveSupabaseSettings(url, anonKey) {
  if (!url || !anonKey) return false;
  const config = { url: url.trim(), anonKey: anonKey.trim() };
  if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = config;
    try {
      localStorage.setItem('nexchat_supabase_config', JSON.stringify(config));
    } catch {}
  }
  return true;
}

export function isSupabaseActive() {
  const settings = getActiveSupabaseSettings();
  return Boolean(settings.active && settings.url && !settings.url.includes('demo-nexchat'));
}
