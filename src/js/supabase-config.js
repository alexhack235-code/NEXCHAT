/**
 * NEXCHAT Supabase Configuration & Credentials Manager
 * Allows runtime configuration via localStorage, UI modal, or environment settings.
 */

export const SUPABASE_DEFAULTS = {
  url: 'https://awsqgcfsvnweffhfqacr.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c3FnY2Zzdm53ZWZmaGZxYWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxODY3NzYsImV4cCI6MjEwOTc2Mjc3Nn0.SrKuYqYkLNMo73VQe1rQibGop8Q6fpCGUna-7vDNPj4',
  publishableKey: 'sb_publishable_nYCpNXPPn6irP_fe4sYPww_-246rL81',
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
