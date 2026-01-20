// src/storage.js

const STORAGE_KEYS = {
  PATTERNS: 'ck_ptn_v13',
  PROJECTS: 'ck_prj_v13',
  YARNS: 'ck_yrn_v13',
  THEME: 'ck_thm_v13',
  CATEGORIES: 'ck_cat_v13',

  SYNC_SETTINGS: 'knit_sync_settings_v1',
  GITHUB_TOKEN: 'knit_github_token_v1',

  // ✅ 一鍵上傳加速用
  SYNC_LAST_SHA: 'ck_sync_last_sha_v1',
  SYNC_LAST_PUSH_AT: 'ck_sync_last_push_at_v1',
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
      categories: ['圍巾', '毛帽', '毛衣', '襪子', '未分類'],
    };
  }

  const ls = window.localStorage;

  return {
    savedPatterns: safeParse(ls.getItem(STORAGE_KEYS.PATTERNS), []),
    activeProjects: safeParse(ls.getItem(STORAGE_KEYS.PROJECTS), []),
    yarns: safeParse(ls.getItem(STORAGE_KEYS.YARNS), []),
    themeKey: ls.getItem(STORAGE_KEYS.THEME) || 'PURPLE',
    categories: safeParse(ls.getItem(STORAGE_KEYS.CATEGORIES), [
      '圍巾',
      '毛帽',
      '毛衣',
      '襪子',
      '未分類',
    ]),
  };
}

export function saveAppState({
  savedPatterns = [],
  activeProjects = [],
  yarns = [],
  themeKey = 'PURPLE',
  categories = [], // ✅ 關鍵
} = {}) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const ls = window.localStorage;

  ls.setItem(STORAGE_KEYS.PATTERNS, JSON.stringify(savedPatterns));
  ls.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(activeProjects));
  ls.setItem(STORAGE_KEYS.YARNS, JSON.stringify(yarns));
  ls.setItem(STORAGE_KEYS.THEME, themeKey);
  ls.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
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

// ---- ✅ 一鍵上傳：記住 sha / 上傳時間 ----

export function loadLastSha() {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  return window.localStorage.getItem(STORAGE_KEYS.SYNC_LAST_SHA) || '';
}

export function saveLastSha(sha) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!sha) window.localStorage.removeItem(STORAGE_KEYS.SYNC_LAST_SHA);
  else window.localStorage.setItem(STORAGE_KEYS.SYNC_LAST_SHA, sha);
}

export function loadLastPushAt() {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  return window.localStorage.getItem(STORAGE_KEYS.SYNC_LAST_PUSH_AT) || '';
}

export function saveLastPushAt(iso) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!iso) window.localStorage.removeItem(STORAGE_KEYS.SYNC_LAST_PUSH_AT);
  else window.localStorage.setItem(STORAGE_KEYS.SYNC_LAST_PUSH_AT, iso);
}
