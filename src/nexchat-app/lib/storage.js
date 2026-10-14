import { INITIAL_CHATS } from './initialChats.js';

const STORAGE_KEY = 'nexchat_data_store';
const THEME_KEY = 'nexchat_theme_mode';
const LOGS_KEY = 'nexchat_terminal_history';

// Listeners for reactive sync
const listeners = new Set();

export function getStoredChats() {
  if (typeof window === 'undefined') return INITIAL_CHATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CHATS));
      return INITIAL_CHATS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load chats from localStorage', e);
    return INITIAL_CHATS;
  }
}

export function saveStoredChats(chats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    notifySubscribers();
  } catch (e) {
    console.error('Failed to save chats', e);
  }
}

export function subscribeToChats(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifySubscribers() {
  const current = getStoredChats();
  listeners.forEach((fn) => fn(current));
}

// Log dispatcher between UI and Terminal
const terminalLogSubscribers = new Set();

export function emitTerminalLog(message, type = 'info') {
  terminalLogSubscribers.forEach((fn) => fn({ message, type, time: new Date().toLocaleTimeString() }));
}

export function subscribeTerminalLogs(callback) {
  terminalLogSubscribers.add(callback);
  return () => terminalLogSubscribers.delete(callback);
}

// Theme storage
export function getStoredTheme() {
  if (typeof window === 'undefined') return 'hacker';
  return localStorage.getItem(THEME_KEY) || 'hacker';
}

export function setStoredTheme(theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}
