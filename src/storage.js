// src/storage.js

const STORAGE_KEYS = {
  PATTERNS: 'ck_ptn_v13',
  PROJECTS: 'ck_prj_v13',
  YARNS: 'ck_yrn_v13',
  THEME: 'ck_thm_v13',
  SYNC_SETTINGS: 'knit_sync_settings_v1',
  GITHUB_TOKEN: 'knit_github_token_v1',
};

function safeParse(json, fallback) {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

export function loadAppState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      savedPatterns: [],
      activeProjects: [],
      yarns: [],
      themeKey: 'PURPLE',
    };
  }

  const ls = window.localStorage;

  return {
    savedPatterns: safeParse(ls.getItem(STORAGE_KEYS.PATTERNS), []),
    activeProjects: safeParse(ls.getItem(STORAGE_KEYS.PROJECTS), []),
    yarns: safeParse(ls.getItem(STORAGE_KEYS.YARNS), []),
    themeKey: ls.getItem(STORAGE_KEYS.THEME) || 'PURPLE',
  };
}

export function saveAppState({ savedPatterns, activeProjects, yarns, themeKey }) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const ls = window.localStorage;

  ls.setItem(STORAGE_KEYS.PATTERNS, JSON.stringify(savedPatterns || []));
  ls.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(activeProjects || []));
  ls.setItem(STORAGE_KEYS.YARNS, JSON.stringify(yarns || []));
  ls.setItem(STORAGE_KEYS.THEME, themeKey || 'PURPLE');
}

// ---- GitHub 設定 / Token ----

export function loadSyncSettings() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      owner: '',
      repo: '',
      branch: 'main',
      path: 'data/knitting.json',
    };
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.SYNC_SETTINGS);
  const fallback = {
    owner: '',
    repo: '',
    branch: 'main',
    path: 'data/knitting.json',
  };
  return safeParse(raw, fallback);
}

export function saveSyncSettings(settings) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(
    STORAGE_KEYS.SYNC_SETTINGS,
    JSON.stringify(settings || {})
  );
}

export function loadToken() {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  return window.localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN) || '';
}

export function saveToken(token) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!token) {
    window.localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
  } else {
    window.localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
  }
}
