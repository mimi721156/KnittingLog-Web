// src/app.jsx
import {
  loadAppState,
  saveAppState,
  loadSyncSettings,
  saveSyncSettings,
  loadToken,
  saveToken,
} from './src/storage.js';
import { loadFromGitHub, saveToGitHub } from './src/githubContentsApi.js';

const { useState, useEffect, useMemo, useRef } = React;

// === Theme color helpers (for dark-mode-safe surfaces) ===
function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  const toHex = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const m = (x, y) => x + (y - x) * t;
  return rgbToHex(m(A.r, B.r), m(A.g, B.g), m(A.b, B.b));
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function isDarkHex(hex) {
  return luminance(hex) < 0.45;
}



// === 基礎設定 ===

const SYMBOLS = {
  KNIT: { id: 'KNIT', label: '下針', symbol: '│', color: 'bg-white' },
  PURL: { id: 'PURL', label: '上針', symbol: '─', color: 'bg-gray-100' },
  YO: { id: 'YO', label: '掛針', symbol: '○', color: 'bg-blue-50' },
  K2TOG: { id: 'K2TOG', label: '左上二併', symbol: '人', color: 'bg-red-50' },
  SSK: { id: 'SSK', label: '右上二併', symbol: '入', color: 'bg-red-50' },
  SLIP: { id: 'SLIP', label: '滑針', symbol: 'V', color: 'bg-yellow-50' },
  M1R: { id: 'M1R', label: '右加針', symbol: '⅄', color: 'bg-green-50' },
  M1L: { id: 'M1L', label: '左加針', symbol: 'λ', color: 'bg-green-50' },
  CABLE: { id: 'CABLE', label: '麻花', symbol: '⚡', color: 'bg-purple-50' },
  NO_STITCH: {
    id: 'NO_STITCH',
    label: '無針',
    symbol: '✕',
    color: 'bg-gray-200 text-gray-400',
  },
};

// const THEMES = {
//   PURPLE: {
//     id: 'PURPLE',
//     primary: '#8e8499',
//     bg: '#f4f2f7',
//     text: '#5d5666',
//     accent: '#dcd3e3',
//   },
//   BLUE: {
//     id: 'BLUE',
//     primary: '#7da1c4',
//     bg: '#f0f5f9',
//     text: '#4e6173',
//     accent: '#cfe0eb',
//   },
//   PINK: {
//     id: 'PINK',
//     primary: '#c48e8e',
//     bg: '#faf3f3',
//     text: '#735252',
//     accent: '#ebcfcf',
//   },
//   DARK: {
//     id: 'DARK',
//     primary: '#1a1a1a',
//     bg: '#ffffff',
//     text: '#1a1a1a',
//     accent: '#eeeeee',
//   },
// };


// 擴充後的 13 套主題資料，新增「午夜板岩」灰色系
const THEMES = {
  // --- 淺色系 ---
  PURPLE: { id: 'PURPLE', name: '薰衣草', primary: '#8e8499', bg: '#f4f2f7', text: '#5d5666', accent: '#dcd3e3' },
  BLUE: { id: 'BLUE', name: '靜謐藍', primary: '#7da1c4', bg: '#f0f5f9', text: '#4e6173', accent: '#cfe0eb' },
  PINK: { id: 'PINK', name: '櫻花粉', primary: '#c48e8e', bg: '#faf3f3', text: '#735252', accent: '#ebcfcf' },
  GREEN: { id: 'GREEN', name: '抹茶森林', primary: '#7B8E6F', bg: '#F2F4EF', text: '#4A5443', accent: '#DDE3D5' },
  SAND: { id: 'SAND', name: '燕麥奶茶', primary: '#A69080', bg: '#F8F6F4', text: '#594E46', accent: '#E6DED8' },
  
  // --- 午夜深色系 (Midnight Variations) ---
  NIGHT_BLUE: { id: 'NIGHT_BLUE', name: '午夜藍', primary: '#A1B5D1', bg: '#1A1C23', text: '#E2E4E9', accent: '#2D313E' },
  NIGHT_GREEN: { id: 'NIGHT_GREEN', name: '午夜森林', primary: '#8DBA8F', bg: '#161B16', text: '#E0E6E1', accent: '#242B24' },
  NIGHT_PURPLE: { id: 'NIGHT_PURPLE', name: '午夜漿果', primary: '#B2A3D1', bg: '#18151D', text: '#E6E1E9', accent: '#26222C' },
  NIGHT_ROSE: { id: 'NIGHT_ROSE', name: '午夜紅玫瑰', primary: '#D1A1A1', bg: '#1D1515', text: '#E9E1E1', accent: '#2D2222' },
  
  // ✅ 新增：午夜板岩 (更具現代感的藍灰色調)
  NIGHT_SLATE: { id: 'NIGHT_SLATE', name: '午夜板岩', primary: '#94A3B8', bg: '#0F172A', text: '#F1F5F9', accent: '#1E293B' },
  
  NIGHT_GRAY: { id: 'NIGHT_GRAY', name: '午夜極黑', primary: '#9DA5B4', bg: '#121212', text: '#E3E3E3', accent: '#242424' },
  NIGHT_COFFEE: { id: 'NIGHT_COFFEE', name: '午夜可可', primary: '#D4B499', bg: '#1A1816', text: '#ECE5E0', accent: '#292523' },
  DARK: { id: 'DARK', name: '簡約黑', primary: '#1a1a1a', bg: '#ffffff', text: '#1a1a1a', accent: '#eeeeee' },
};


// === Icons ===

const Icons = {
  Play: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Library: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5V5a2 2 0 0 1 2-2h3" />
      <path d="M10 3h6a2 2 0 0 1 2 2v14.5" />
      <path d="M8 21h8" />
    </svg>
  ),
  Grid: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  ),
  Yarn: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Info: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  Trash: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
Trash2: ({ size = 16, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Plus: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Cloud: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 10a4 4 0 0 0-7.9-1A4 4 0 0 0 6 17h11a3 3 0 0 0 1-5.83" />
    </svg>
  ),
  X: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  StickyNote: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M15 3v5h5" />
    </svg>
  ),
  ScrollText: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4h11a2 2 0 0 1 2 2v10" />
      <path d="M7 20h10a2 2 0 0 0 2-2v-1" />
      <path d="M7 4a2 2 0 0 0-2 2v10" />
      <path d="M11 7h4" />
      <path d="M9 11h6" />
      <path d="M9 15h3" />
    </svg>
  ),
   X: ({ size = 20, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  ),
       Menu: ({ size = 20, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  ),

  Check: ({ size = 18, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="5 13 9 17 19 7" />
    </svg>
  ),
Layers: ({ size = 20, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12 3 3 9 12 15 21 9 12 3" />
      <polyline points="3 14 12 20 21 14" />
    </svg>
  ),
    
   ChevronUp: ({ size = 12, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="5 15 12 8 19 15" />
    </svg>
  ),
  ChevronDown: ({ size = 12, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="5 9 12 16 19 9" />
    </svg>
  ),
  Bell: ({ size = 18, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-2 9-2 9h16s-2-2-2-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),

  Sparkles: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5z" />
      <path d="M5 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
      <path d="M19 16l.5 1 .9.5-.9.5-.5 1-.5-1-.9-.5.9-.5z" />
    </svg>
  ),
  GripVertical: ({ size = 16, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M128 40c0-22.1-17.9-40-40-40L40 0C17.9 0 0 17.9 0 40L0 88c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM0 424l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 40c0-22.1-17.9-40-40-40L232 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM192 232l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 424c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z"/>
    </svg>
  ),
};

// === 小工具 ===



function cls(...names) {
  return names.filter(Boolean).join(' ');
}

function calculateTotalRows(parts) {
  if (!parts || parts.length === 0) return 0;
  return parts.reduce((acc, part) => {
    const sections = part.textSections || [];
    const partTotal = sections.reduce((sum, sec) => {
      const rows = Number(sec.rowsPerLoop || 0);
      const rep = Number(sec.repeats || 0);
      return sum + rows * rep;
    }, 0);
    return acc + partTotal;
  }, 0);
}


const createNewPattern = (type = 'CHART', category = '未分類') => {
  const now = new Date().toISOString();

  const baseTextSections = [
    {
      id: crypto.randomUUID(),
      title: '起針段',
      content: '',
      repeats: 1,
      rowsPerLoop: 1,
    },
  ];

  const base = {
    id: crypto.randomUUID(),
    name: '未命名織圖',
    type,
    category,
    updatedAt: now,
    meta: {
      castOn: '',
      needle: '',
      yarnId: null,
    },
    notes: '',
    alerts: [],
    sections: [
      {
        id: crypto.randomUUID(),
        name: '主體',
        rows: 8,
        cols: 10,
        grid: Array(8)
          .fill(null)
          .map(() => Array(10).fill('KNIT')),
      },
    ],
    textSections: baseTextSections,
  };

  if (type === 'TEXT') {
    const partId = crypto.randomUUID();
    return {
      ...base,
      parts: [
        {
          id: partId,
          name: '主體',
          textSections: baseTextSections,
          alerts: [],
        },
      ],
    };
  }

  return {
    ...base,
    parts: [],
  };
};

// 幫舊版織圖補上 parts 欄位（TEXT 織圖預設一個「主體」部位）
const normalizePattern = (p) => {
  if (!p) return p;

  if (
    Array.isArray(p.parts) &&
    p.parts.length > 0 &&
    typeof p.parts[0] === 'object' &&
    p.parts[0] !== null
  ) {
    return p;
  }

  if (p.type === 'TEXT') {
    const baseTextSections =
      Array.isArray(p.textSections) && p.textSections.length
        ? p.textSections
        : [
            {
              id: crypto.randomUUID(),
              title: '起針段',
              content: '',
              repeats: 1,
              rowsPerLoop: 1,
            },
          ];

    const baseAlerts = Array.isArray(p.alerts) ? p.alerts : [];

    if (!Array.isArray(p.parts) || p.parts.length === 0) {
      const partId = crypto.randomUUID();
      return {
        ...p,
        textSections: baseTextSections,
        alerts: baseAlerts,
        parts: [
          {
            id: partId,
            name: '主體',
            textSections: baseTextSections,
            alerts: baseAlerts,
          },
        ],
      };
    }

    if (
      Array.isArray(p.parts) &&
      p.parts.length > 0 &&
      typeof p.parts[0] === 'string'
    ) {
      const parts = p.parts.map((name) => ({
        id: crypto.randomUUID(),
        name,
        textSections: baseTextSections,
        alerts: baseAlerts,
      }));

      return {
        ...p,
        textSections: baseTextSections,
        alerts: baseAlerts,
        parts,
      };
    }
  }

  return p;
};

const createProjectFromPattern = (ptn) => {
  const now = new Date().toISOString();
  const normalizedPattern = normalizePattern(ptn);

  const patternParts =
    Array.isArray(normalizedPattern.parts) &&
    normalizedPattern.parts.length > 0
      ? normalizedPattern.parts
      : [
          {
            id: crypto.randomUUID(),
            name: '主體',
            textSections: normalizedPattern.textSections || [],
            alerts: normalizedPattern.alerts || [],
          },
        ];

  const partsProgress = patternParts.map((part) => ({
    partId: part.id,
    name: part.name,
    totalRow: 1,
    sectionRow: 1,
  }));

  const firstPartId = partsProgress[0]?.partId ?? null;

  return {
    id: crypto.randomUUID(),
    patternId: normalizedPattern.id,
    patternName: normalizedPattern.name,
    projectName: normalizedPattern.name,
    category: normalizedPattern.category || '未分類',
    yarnId: normalizedPattern.meta?.yarnId ?? null,
    needle: normalizedPattern.meta?.needle ?? '',
    castOn: normalizedPattern.meta?.castOn ?? '',
    totalRow: 1,
    sectionRow: 1,
    notes: '',
    startAt: now,
    lastActive: now,
    currentPartId: firstPartId,
    partsProgress,
  };
};

// 把舊版專案資料補上多部位進度欄位
const normalizeProject = (p) => {
  if (!p) return p;

  if (Array.isArray(p.partsProgress) && p.partsProgress.length > 0) {
    return p;
  }

  const mainTotalRow =
    typeof p.totalRow === 'number' && p.totalRow > 0 ? p.totalRow : 1;
  const mainSectionRow =
    typeof p.sectionRow === 'number' && p.sectionRow > 0 ? p.sectionRow : 1;

  const mainPartId = crypto.randomUUID();

  return {
    ...p,
    currentPartId: mainPartId,
    partsProgress: [
      {
        partId: mainPartId,
        name: '主體',
        totalRow: mainTotalRow,
        sectionRow: mainSectionRow,
      },
    ],
  };
};

  const Modal = ({ title, onClose, children, icon: Icon }) => (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-theme-text/30 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <div className="flex justify-between items-center px-5 py-4 border-b border-theme-bg/40">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-theme-bg flex items-center justify-center text-theme-text">
                <Icon size={18} />
              </div>
            )}
            <h3 className="font-black text-theme-text text-base tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-theme-bg/70 transition-colors"
          >
            <Icons.X size={18} className="text-theme-text/40" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  // --- 棒針 + 勾針 組合圖示 ---
  const KnittingIcon = ({ size = 64, color = 'var(--primary-color)' }) => (
    <svg
    width={size}
    height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 使用 currentColor 或直接讀取變數 */}
      {/* ✅ 關鍵修正：將 color 套用至群組的 stroke 與 fill */}
      <g stroke={color} fill={color}>
        {/* 棒針 1 */}
        <line
          x1="15" y1="15" x2="49" y2="49"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="13" cy="13" r="3" />

        {/* 棒針 2 */}
        <line
          x1="49" y1="15" x2="15" y2="49"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="51" cy="13" r="3" />

        {/* 勾針 */}
        <path
          d="M32 10V50M32 50C32 50 32 54 28 54"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none" /* 勾針主體不填滿 */
        />
        <path
          d="M32 50.5C33.5 49 35 48 37 49"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );

// --- 預設封面元件 ---
const DefaultCover = ({ name }) => {
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#F1F3EE]">
      {/* 背景紋路 - 模擬編織感 */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 100 100">
        <pattern id="knitPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M10 0 Q15 10 10 20 M10 0 Q5 10 10 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#knitPattern)" />
      </svg>

      {/* 中央組合圖示 */}
      <div className="relative flex flex-col items-center gap-4">
        <div className="p-2 bg-white/60 backdrop-blur-md rounded-[2rem] shadow-sm border border-white/50 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <KnittingIcon color='var(--primary-color)' />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em] mb-1">
            Handmade
          </span>
          <div className="h-[1px] w-8 bg-black/10 mb-2" />
          <span className="text-[11px] font-bold text-[#344E41]/40 max-w-[120px] text-center truncate px-2">
            {name || 'New Pattern'}
          </span>
        </div>
      </div>
    </div>
  );
};


// === GitHub Sync Dialog ===

const PATH_PRESETS = ['data/knitting.json', 'data/xiangdata.json'];

function GitHubSyncDialog({ open, onClose, onApplyRemote, currentState }) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [path, setPath] = useState('data/knitting.json');
  const [customPath, setCustomPath] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const s = loadSyncSettings();
    const t = loadToken();
    setOwner(s.owner || 'mimi721156');
    setRepo(s.repo || 'KnittingLog-Data');
    setBranch(s.branch || 'main');
    const loadedPath = s.path || 'data/knitting.json';
    setPath(loadedPath);
    if (loadedPath && !PATH_PRESETS.includes(loadedPath)) {
      setCustomPath(loadedPath);
    } else {
      setCustomPath('');
    }
    setToken(t || '');
    setStatus('');
    setStatusType('info');
  }, [open]);

  if (!open) return null;

  const settings = { owner, repo, branch, path, token };

  const persistSettings = () => {
    saveSyncSettings({ owner, repo, branch, path });
    saveToken(token);
  };

  const handleLoad = async () => {
    setLoading(true);
    setStatus('正在從 GitHub 載入資料…');
    setStatusType('info');
    try {
      persistSettings();
      const result = await loadFromGitHub(settings);
      onApplyRemote(result.data || {});
      setStatus(`載入成功 ✓ (sha: ${result.sha.slice(0, 7)}…)`);
      setStatusType('success');
    } catch (err) {
      setStatus(String(err.message || err));
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus('正在將目前資料存到 GitHub…');
    setStatusType('info');
    try {
      persistSettings();
      const payload = {
        savedPatterns: currentState.savedPatterns,
        activeProjects: currentState.activeProjects,
        yarns: currentState.yarns,
        themeKey: currentState.themeKey,
        categories: currentState.categories,
      };
      const result = await saveToGitHub(settings, payload);
      setStatus(`儲存成功 ✓ (sha: ${result.sha.slice(0, 7)}…)`);
      setStatusType('success');
    } catch (err) {
      setStatus(String(err.message || err));
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
              Cloud Sync
            </div>
            <div className="font-black text-theme-text">GitHub 雲端同步設定</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold px-2"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">
                Owner
              </label>
              <input
                className="w-full rounded-xl bg-slate-50 border-none px-3 py-2 text-sm"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="例如：mimi721156"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">
                Repo
              </label>
              <input
                className="w-full rounded-xl bg-slate-50 border-none px-3 py-2 text-sm"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="KnittingLog-Data"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">
                Branch
              </label>
              <input
                className="w-full rounded-xl bg-slate-50 border-none px-3 py-2 text-sm"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">
                Path
              </label>
              <select
                className="w-full rounded-xl bg-slate-50 border-none px-3 py-2 text-sm mb-2"
                value={PATH_PRESETS.includes(path) ? path : 'CUSTOM'}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'CUSTOM') {
                    setPath(customPath || '');
                  } else {
                    setPath(v);
                  }
                }}
              >
                {PATH_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="CUSTOM">自訂路徑（Custom）</option>
              </select>

              {!PATH_PRESETS.includes(path) && (
                <input
                  className="w-full rounded-xl bg-slate-50 border-none px-3 py-2 text-sm"
                  value={path}
                  onChange={(e) => {
                    setPath(e.target.value);
                    setCustomPath(e.target.value);
                  }}
                  placeholder="例如：data/friend-001.json"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">
              Fine-grained Token（Contents read/write）
            </label>
            <input
              type="password"
              className="w-full rounded-xl bg-slate-50 border-none px-3 py-2 text-sm"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="只會存在瀏覽器，不會上傳"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleLoad}
              disabled={loading}
              className="flex-1 bg-slate-100 text-theme-text rounded-2xl py-3 text-sm font-black uppercase tracking-[0.15em] disabled:opacity-50"
            >
              從 GitHub 載入
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-theme-primary text-white rounded-2xl py-3 text-sm font-black uppercase tracking-[0.15em] shadow-md disabled:opacity-50"
            >
              存到 GitHub
            </button>
          </div>

          {status && (
            <div
              className={
                'mt-2 text-xs rounded-2xl px-3 py-2 ' +
                (statusType === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : statusType === 'error'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-50 text-slate-600')
              }
            >
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// === 教學頁 ===

// 教學頁內的「個人化外觀」區塊（主題切換）
const ThemePickerSection = ({ themeKey, setThemeKey }) => {
  return (
    <section className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 border border-theme-accent/20 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-theme-primary flex items-center justify-center text-white shadow-lg shadow-theme-primary/20">
          <Icons.Sparkles />
        </div>
        <div>
          <h3 className="text-xl font-black text-theme-text tracking-tight">
            個人化外觀
          </h3>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">
            Appearance Settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
        {Object.values(THEMES).map((t) => {
          const isActive = themeKey === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setThemeKey(t.id)}
              className={
                'group relative flex flex-col items-center gap-3 p-3 rounded-[2rem] transition-all duration-300 ' +
                (isActive
                  ? 'bg-white shadow-xl scale-105'
                  : 'hover:bg-white/40')
              }
            >
              {/* 色彩預覽圓圈 */}
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-transform group-hover:rotate-12"
                style={{
                  backgroundColor: t.bg,
                  borderColor: isActive ? t.primary : 'transparent',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full shadow-inner"
                  style={{ backgroundColor: t.primary }}
                />
              </div>

              {/* 主題名稱 */}
              <span
                className="text-[10px] font-black tracking-tighter opacity-60 group-hover:opacity-100"
                style={{ color: isActive ? t.primary : 'inherit' }}
              >
                {t.name}
              </span>

              {/* 選中提示小勾勾 */}
              {isActive && (
                <div
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-300"
                  style={{ backgroundColor: t.primary }}
                >
                  <Icons.Check size={10} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-theme-accent/10 flex items-center justify-between">
        <p className="text-[11px] text-theme-text/40 font-medium italic">
          提示：切換主題會同時改變 APP 的整體配色。
        </p>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-theme-accent" />
        </div>
      </div>
    </section>
  );
};

// Compact theme picker for dropdown/popover menus (vertical list)
const ThemePickerMenu = ({ themeKey, setThemeKey }) => {
  return (
    <div className="flex flex-col gap-2">
      {Object.values(THEMES).map((t) => {
        const isActive = themeKey === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setThemeKey(t.id)}
            className={
              'w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-200 border ' +
              (isActive
                ? 'bg-white/60 border-theme-accent/30 shadow-sm'
                : 'bg-white/30 hover:bg-white/50 border-transparent')
            }
          >
            <span
              className="w-6 h-6 rounded-full border border-white/60 shadow-sm"
              style={{ backgroundColor: t.primary }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-theme-text tracking-tight truncate">
                {t.name}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-text/35 truncate">
                {t.id}
              </div>
            </div>
            {isActive ? (
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center border border-theme-accent/20"
                style={{ backgroundColor: t.primary }}
              >
                <Icons.Check size={12} className="text-white" />
              </span>
            ) : (
              <span className="text-xs text-theme-text/30">→</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

function TutorialView({ themeKey, setThemeKey }) {
  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12 animate-fade-in pb-32 space-y-10">
      <div>
        <h2 className="text-4xl font-black text-theme-text mb-3 tracking-tighter">
          使用指南與設定
        </h2>
        <p className="text-xs font-black opacity-30 uppercase tracking-[0.25em]">
          Tutorial & Preferences
        </p>
      </div>

      {/* 個人化外觀（Appearance Settings） */}
      <ThemePickerSection themeKey={themeKey} setThemeKey={setThemeKey} />

      {/* 基礎符號 */}
      <div className="bg-white p-10 rounded-[3rem] shadow-cozy border border-white">
        <h3 className="font-black text-theme-primary text-xl mb-10 border-b border-theme-bg pb-5 tracking-widest uppercase">
          基礎符號
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {Object.values(SYMBOLS).map((s) => (
            <div key={s.id} className="text-center group">
              <div
                className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl mb-3 mx-auto transition-all shadow-inner border-2 border-theme-bg ${s.color}`}
              >
                {s.symbol}
              </div>
              <div className="text-[10px] font-black text-theme-text uppercase tracking-widest opacity-80">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === 線材庫 ===

function YarnView({ yarns, onSaveYarn, onDeleteYarn }) {
  const [editing, setEditing] = useState(null);

  const handleSave = () => {
    if (!editing.brand && !editing.name) return;
    onSaveYarn(editing);
    setEditing(null);
  };

  if (editing) {
    return (
      <div className="flex flex-col h-full bg-theme-bg animate-fade-in pb-safe">
        <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => setEditing(null)}
            className="text-gray-400 font-bold px-2 uppercase text-xs"
          >
            Cancel
          </button>
          <span className="font-black text-theme-text text-sm">
            編輯線材資料
          </span>
          <button
            onClick={handleSave}
            className="text-theme-primary font-black px-2 uppercase text-xs"
          >
            Save
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border-2 border-theme-secondary space-y-6">
            <div>
              <label className="text-[10px] font-black opacity-30 uppercase block mb-1 tracking-widest">
                品牌 Brand
              </label>
              <input
                type="text"
                value={editing.brand || ''}
                onChange={(e) =>
                  setEditing({ ...editing, brand: e.target.value })
                }
                className="w-full bg-theme-bg/30 rounded-xl p-4 border-none font-bold focus:ring-2 ring-theme-primary/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-black opacity-30 uppercase block mb-1">
                系列 / 名稱 Name
              </label>
              <input
                type="text"
                value={editing.name || ''}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                className="w-full bg-theme-bg/30 rounded-xl p-4 border-none font-bold focus:ring-2 ring-theme-primary/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-black opacity-30 uppercase block mb-1">
                材質 Material
              </label>
              <input
                type="text"
                placeholder="例如：100% wool / wool 70% + nylon 30%"
                value={editing.material || ''}
                onChange={(e) =>
                  setEditing({ ...editing, material: e.target.value })
                }
                className="w-full bg-theme-bg/30 rounded-xl p-4 border-none text-sm focus:ring-2 ring-theme-primary/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-black opacity-30 uppercase block mb-1">
                粗細 Weight
              </label>
              <input
                type="text"
                placeholder="例如：Fingering / DK / 4.0mm / #2"
                value={editing.weight || ''}
                onChange={(e) =>
                  setEditing({ ...editing, weight: e.target.value })
                }
                className="w-full bg-theme-bg/30 rounded-xl p-4 border-none text-sm focus:ring-2 ring-theme-primary/20"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-theme-text tracking-tighter">
          線材庫
        </h2>
        <button
          onClick={() =>
            setEditing({
              id: crypto.randomUUID(),
              brand: '',
              name: '',
              material: '',
              weight: '',
            })
          }
          className="bg-theme-primary text-white px-8 py-3 rounded-2xl shadow-lg font-black text-xs tracking-widest uppercase"
        >
          + NEW
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {yarns.map((y) => (
          <div
            key={y.id}
            onClick={() => setEditing({ ...y })}
            className="bg-white p-6 rounded-[2.5rem] shadow-cozy border border-white relative active:scale-[0.98] transition cursor-pointer overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-theme-bg rounded-bl-full opacity-50 -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex gap-4">
              <div className="w-16 h-16 bg-theme-bg rounded-2xl flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
                <KnittingIcon size={40} color='var(--primary-color)' />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-theme-text text-lg truncate">
                  {y.name || '未命名'}
                </h3>
                <p className="text-[10px] font-black text-theme-primary uppercase tracking-widest truncate">
                  {y.brand}
                </p>
                {(y.material || y.weight) && (
                  <p className="text-[10px] mt-2 text-gray-500 leading-snug line-clamp-2">
                    {y.material && <span>{y.material}</span>}
                    {y.material && y.weight && <span> · </span>}
                    {y.weight && <span>{y.weight}</span>}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteYarn(y.id);
                }}
                className="text-gray-200 hover:text-red-400 p-1 self-start transition-colors"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === 專案頁（含進度條、可改專案名稱、顯示開始時間） ===

function ProjectView({
  activeProjects,
  savedPatterns,
  yarns,
  onUpdateProject,
  onDeleteProject,
  categoryFilter,
  categories,
  selectedId,
  setSelectedId,
}) {
  const [plusN, setPlusN] = useState('');
  const [showAlertOverlay, setShowAlertOverlay] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 👈 這行要加


  const currentProject = useMemo(
    () => activeProjects.find((x) => x.id === selectedId),
    [activeProjects, selectedId]
  );

  const currentPartProgress = useMemo(() => {
    if (!currentProject || !Array.isArray(currentProject.partsProgress)) {
      return null;
    }
    const parts = currentProject.partsProgress;
    if (parts.length === 0) return null;

    const activePartId =
      currentProject.currentPartId || parts[0].partId || null;

    if (!activePartId) return parts[0];

    return parts.find((p) => p.partId === activePartId) || parts[0];
  }, [currentProject]);

  const currentTotalRow =
    currentPartProgress?.totalRow ?? currentProject?.totalRow ?? 1;

  const currentSectionRow =
    currentPartProgress?.sectionRow ?? currentProject?.sectionRow ?? 1;

  const currentPattern = useMemo(
    () =>
      currentProject
        ? savedPatterns.find((x) => x.id === currentProject.patternId)
        : null,
    [currentProject, savedPatterns]
  );

  const currentPatternPart = useMemo(() => {
    if (!currentPattern || !currentProject) return null;
    if (!Array.isArray(currentPattern.parts) || currentPattern.parts.length === 0)
      return null;

    const activePartId =
      currentProject.currentPartId ||
      currentProject.partsProgress?.[0]?.partId ||
      currentPattern.parts[0].id;

    return (
      currentPattern.parts.find((p) => p.id === activePartId) ||
      currentPattern.parts[0]
    );
  }, [currentPattern, currentProject]);

  const projectStats = useMemo(() => {
    if (!currentPattern || currentPattern.type !== 'TEXT')
      return { targetTotal: 0, activeSection: null, sectionsSummary: [] };

    const sectionsSource =
      currentPatternPart?.textSections && currentPatternPart.textSections.length
        ? currentPatternPart.textSections
        : currentPattern.textSections || [];

    if (!sectionsSource || !sectionsSource.length) {
      return { targetTotal: 0, activeSection: null, sectionsSummary: [] };
    }

    let cumulativeRows = 0;
    let activeSection = null;
    const total = currentTotalRow;

    const summary = sectionsSource.map((s) => {
      const sectionTotal = (s.rowsPerLoop || 1) * (s.repeats || 1);
      const startRow = cumulativeRows + 1;
      cumulativeRows += sectionTotal;

      if (total >= startRow && total <= cumulativeRows) {
        activeSection = {
          ...s,
          startRow,
          endRow: cumulativeRows,
          totalRows: sectionTotal,
        };
      }

      return { ...s, totalRows: sectionTotal, startRow, endRow: cumulativeRows };
    });

    return { targetTotal: cumulativeRows, sectionsSummary: summary, activeSection };
  }, [currentPattern, currentPatternPart, currentTotalRow]);

  const currentPartTitle =
    currentPatternPart?.name || currentPatternPart?.title || '目前部位';

  const currentRow = currentTotalRow;

  const totalRows =
    currentPattern?.type === 'TEXT' && projectStats.targetTotal
      ? projectStats.targetTotal
      : null;

  const progressPercent =
    typeof totalRows === 'number' && totalRows > 0
      ? Math.round((currentRow / totalRows) * 100)
      : 0;

  const listProjects = useMemo(() => {
    const filtered =
      categoryFilter && categoryFilter !== 'ALL'
        ? activeProjects.filter(
            (p) => (p.category || '未分類') === categoryFilter
          )
        : activeProjects;

    return filtered.map((p) => {
      const pat = savedPatterns.find((x) => x.id === p.patternId);

      // 非 TEXT：不算多部位進度，ROWS 就顯示 totalRow
      if (!pat || pat.type !== 'TEXT') {
        return {
          project: p,
          pattern: pat,
          partsMeta: null,
          plannedRows: null,
          currentPartName: null,
          currentPartRow: p.totalRow || 0,
          currentPartTarget: null,
        };
      }

      // 有 parts 就用 parts，沒有就整個 pattern 當作一個部位
      const rawParts =
        Array.isArray(pat.parts) && pat.parts.length > 0
          ? pat.parts
          : [
              {
                id: 'MAIN',
                name: '主體',
                textSections: pat.textSections || [],
              },
            ];

      // 每個部位自己的目標排數
      const partsMeta = rawParts.map((part, idx) => {
        const sections = part.textSections || [];
        const targetRows = sections.reduce(
          (sum, s) => sum + (s.repeats || 1) * (s.rowsPerLoop || 1),
          0
        );
        return {
          partId: part.id || part.partId || `PART_${idx}`,
          name: part.name || `部位 ${idx + 1}`,
          targetRows,
        };
      });

      const plannedRows = partsMeta.reduce(
        (sum, m) => sum + (m.targetRows || 0),
        0
      ) || null;

      // 找出目前啟用的部位進度
      let currentPartProgress = null;
      if (Array.isArray(p.partsProgress) && p.partsProgress.length > 0) {
        currentPartProgress =
          (p.currentPartId &&
            p.partsProgress.find((pp) => pp.partId === p.currentPartId)) ||
          p.partsProgress[0];
      }

      const fallbackPartMeta = partsMeta[0] || null;

      const activePartMeta =
        (currentPartProgress &&
          partsMeta.find((m) => m.partId === currentPartProgress.partId)) ||
        fallbackPartMeta;

      const currentPartRow =
        (currentPartProgress && (currentPartProgress.totalRow || 0)) ||
        p.totalRow ||
        0;

      const currentPartName = activePartMeta?.name || null;
      const currentPartTarget = activePartMeta?.targetRows || null;

      return {
        project: p,
        pattern: pat,
        partsMeta,
        plannedRows,
        currentPartName,
        currentPartRow,
        currentPartTarget,
      };
    });
  }, [activeProjects, savedPatterns, categoryFilter]);

  const currentAlerts = useMemo(() => {
    if (!currentProject || !currentPattern) return [];

    const alertsSource =
      currentPatternPart?.alerts && currentPatternPart.alerts.length
        ? currentPatternPart.alerts
        : currentPattern.alerts || [];

    if (!alertsSource.length) return [];

    const total = currentTotalRow;

    return alertsSource.filter((a) => {
      let val;

      if (a.sectionId && a.sectionId !== 'ALL') {
        const sec = projectStats.sectionsSummary?.find(
          (s) => s.id === a.sectionId
        );
        if (!sec) return false;

        const sectionRowFromStart = total - sec.startRow + 1;
        if (sectionRowFromStart < 1 || sectionRowFromStart > sec.totalRows) {
          return false;
        }

        val = a.type === 'SECTION' ? sectionRowFromStart : total;
      } else {
        val = a.type === 'SECTION' ? currentSectionRow : total;
      }

      if (a.mode === 'EVERY') {
        const start = a.startFrom || 0; // 若沒設定起始，則從 0 開始算（例如 Every 6 就會是 6, 12...）
        
        // 如果還沒到開始排數，不觸發
        if (val < start || val <= 0) return false;
        
        // 計算間隔是否吻合
        const diff = val - start;
        const isHit = diff % a.value === 0;
        
        // 3. 處理重複次數 (repeatCount)
        if (isHit && a.repeatCount && a.repeatCount > 0) {
          // 計算目前是第幾次觸發 (例如 start=2, value=2, val=4, 則次數為 2)
          const currentIteration = Math.floor(diff / a.value) + 1;
          return currentIteration <= a.repeatCount;
        }

        return isHit;
      }

      return val === a.value;
    });
  }, [
    currentProject?.id,
    currentPattern,
    currentPatternPart,
    projectStats,
    currentTotalRow,
    currentSectionRow,
  ]);

  const alertKey = useMemo(() => {
    if (!currentProject || currentAlerts.length === 0) return null;

    const ids = currentAlerts.map((a) => a.id || '').join('|');
    const projId = currentProject.id || 'current';
    const row = currentTotalRow || 0;

    return `${projId}:${row}:${ids}`;
  }, [currentProject, currentAlerts, currentTotalRow]);

  useEffect(() => {
    if (alertKey) {
      setShowAlertOverlay(true);
    }
  }, [alertKey]);

  // 在 ProjectView 元件內部
  useEffect(() => {
    // 當 selectedId 從 null 變成有值（進入明細頁）時觸發
    if (selectedId) {
      // 透過 querySelector 抓取您的 main 標籤
      const mainElement = document.querySelector('main');
      
      if (mainElement) {
        // 強制重置捲動位置為頂部
        mainElement.scrollTop = 0;
      }
      
      // 為了保險起見，也重置視窗層級的捲動（針對行動端瀏覽器特性）
      window.scrollTo(0, 0);
    }
  }, [selectedId]); // 當選取的 ID 改變時執行

  const sectionLoopInfo = useMemo(() => {
    if (!currentProject || !currentPattern) return null;

    // 狀況一：文字織圖 (TEXT)
    if (
      currentPattern.type === 'TEXT' &&
      projectStats.activeSection
    ) {
      const sec = projectStats.activeSection;
      
      // --- 核心邏輯修改處 ---
      // 優先使用自定義的花樣循環 patternRows，若沒設定則 fallback 到區段的 rowsPerLoop
      const patternRows = sec.patternRows || sec.rowsPerLoop || 1;
      const sectionTotalRows = sec.totalRows; // 該區段總長度（例如 44）
      // ----------------------

      const offsetFromStart = currentTotalRow - sec.startRow;
      if (offsetFromStart < 0) return null;

      // 計算目前的輪數與排數
      const loopIndex = Math.floor(offsetFromStart / patternRows) + 1;
      const loopRow = (offsetFromStart % patternRows) + 1;

      // --- 動態計算目前這輪的總排數 ---
      let displayRowsPerLoop = patternRows;
      
      // 計算這區段總共有幾輪（含不完整的小數輪）
      const totalLoops = Math.ceil(sectionTotalRows / patternRows);

      // 如果目前就是最後一輪
      if (loopIndex === totalLoops) {
        // 剩餘排數 = 總排數 - (前面的完整輪數 * 每輪排數)
        // 例如：44 - (3 * 12) = 8
        const remainingRows = sectionTotalRows - (Math.floor(sectionTotalRows / patternRows) * patternRows);
        
        // 如果餘數為 0，代表剛好整除，最後一輪也是滿的；如果有餘數，則顯示餘數
        if (remainingRows > 0) {
          displayRowsPerLoop = remainingRows;
        }
      }

      return {
        mode: 'TEXT',
        title: sec.title,
        loopRow,
        loopIndex,
        totalLoops,
        rowsPerLoop: displayRowsPerLoop, // 這裡會動態變動
        isPatternMode: !!sec.patternRows,
        isLastLoop: loopIndex === totalLoops // 標記是否為最後一輪，可用於 UI 提示
      };
    }

    // 狀況二：圖表織圖 (CHART)
    if (
      currentPattern.type === 'CHART' &&
      currentPattern.sections &&
      currentPattern.sections[0]
    ) {
      const sec = currentPattern.sections[0];
      const rowsPerLoop = sec.rows || 1;
      const sr = currentProject.sectionRow || 1;
      const offset = (sr - 1) % rowsPerLoop;
      const loopRow = offset + 1;
      const loopIndex = Math.floor((sr - 1) / rowsPerLoop) + 1;

      return {
        mode: 'CHART',
        title: sec.name || '主體',
        loopRow,
        loopIndex,
        rowsPerLoop,
        isPatternMode: false
      };
    }

    return null;
  }, [currentProject, currentPattern, projectStats, currentTotalRow]);

  const update = (d) => {
    if (!currentProject) return;
    if (!currentPartProgress) return;

    const now = new Date().toISOString();

    const newTotal = Math.max(1, currentPartProgress.totalRow + d);
    const newSection = Math.max(1, currentPartProgress.sectionRow + d);

    const updatedParts = (currentProject.partsProgress || []).map((p) =>
      p.partId === currentPartProgress.partId
        ? { ...p, totalRow: newTotal, sectionRow: newSection }
        : p
    );

    onUpdateProject({
      ...currentProject,
      totalRow: newTotal,
      sectionRow: newSection,
      partsProgress: updatedParts,
      lastActive: now,
    });
  };

  const findYarnLabel = (id) => {
    const y = yarns.find((yy) => yy.id === id);
    if (!y) return null;
    const main = [y.brand, y.name].filter(Boolean).join(' ');
    return main || '未命名線材';
  };

  const [showFullInstruction, setShowFullInstruction] = React.useState(false);

  const activeInstruction = projectStats.activeSection; // 目前段落
  const activeInstructionText = activeInstruction?.content || '';

    const { ongoingProjects, completedProjects } = useMemo(() => {
    const ongoing = [];
    const completed = [];

    listProjects.forEach((item) => {
      const { project: p, partsMeta, plannedRows } = item;
      let doneRows = 0;

      // 延用您原本的進度計算邏輯
      if (plannedRows && plannedRows > 0) {
        if (Array.isArray(partsMeta) && Array.isArray(p.partsProgress) && p.partsProgress.length > 0) {
          doneRows = partsMeta.reduce((sum, meta, idx) => {
            const prog = p.partsProgress[idx];
            const actual = prog?.totalRow ?? 0;
            return sum + Math.min(actual, meta.targetRows || 0);
          }, 0);
        } else {
          doneRows = Math.min(p.totalRow || 0, plannedRows);
        }
      }

      const ratio = plannedRows > 0 ? doneRows / plannedRows : 0;
      
      // 分類：大於等於 1 (100%) 歸類為已完成
      if (ratio >= 1) {
        completed.push(item);
      } else {
        ongoing.push(item);
      }
    });

    return { ongoingProjects: ongoing, completedProjects: completed };
  }, [listProjects]);

  // 增加一個 State 來控制目前顯示哪個 Tab
  const [activeTab, setActiveTab] = useState('ONGOING'); // 'ONGOING' 或 'COMPLETED'
  const displayList = activeTab === 'ONGOING' ? ongoingProjects : completedProjects;

  if (!selectedId) {
    return (
      <div className="max-w-6xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-theme-text tracking-tight mb-2">
              {activeTab === 'ONGOING' ? '進行中專案' : '已完成專案'}
            </h2>
            <p className="text-xs font-black opacity-30 uppercase tracking-widest">
              {activeTab === 'ONGOING' ? 'Working on these' : 'Finished masterpieces'}
            </p>
          </div>

          {/* 切換 Tab */}
          <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('ONGOING')}
              className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all ${
                activeTab === 'ONGOING' ? 'bg-white shadow-sm text-theme-primary' : 'text-gray-400'
              }`}
            >
              進行中 ({ongoingProjects.length})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all ${
                activeTab === 'COMPLETED' ? 'bg-white shadow-sm text-theme-primary' : 'text-gray-400'
              }`}
            >
              已完成 ({completedProjects.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayList.map(
            ({
              project: p,
              pattern: pat,
              partsMeta,
              plannedRows,
              currentPartName,
              currentPartRow,
              currentPartTarget,
            }) => {
              let ratio = null;
              let doneRows = 0;

              if (plannedRows && plannedRows > 0) {
                if (
                  Array.isArray(partsMeta) &&
                  Array.isArray(p.partsProgress) &&
                  p.partsProgress.length > 0
                ) {
                  // 用 index 對應部位進度，計算「全部部位加總的完成排數」
                  doneRows = partsMeta.reduce((sum, meta, idx) => {
                    const prog = p.partsProgress[idx];
                    const actual =
                      prog && typeof prog.totalRow === 'number'
                        ? prog.totalRow
                        : 0;
                    const limit = meta.targetRows || 0;
                    return sum + Math.min(actual, limit);
                  }, 0);
                } else {
                  const total =
                    typeof p.totalRow === 'number' ? p.totalRow : 0;
                  doneRows = Math.min(total, plannedRows);
                }

                ratio =
                  plannedRows > 0 ? Math.min(1, doneRows / plannedRows) : null;
              }

              const overallPercent =
                ratio !== null ? Math.round(ratio * 100) : null;

              const title = p.projectName || p.patternName;

              // ROWS 區塊顯示「目前部位」的排數
              const displayDone = currentPartRow ?? 0;
              const displayTarget = currentPartTarget || null;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer"
                >
                  {/* 頂端：ID + 標籤 + 刪除鈕 */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-zen-mono font-bold text-theme-primary bg-theme-bg px-2 py-0.5 rounded-md">
                          {p.id.slice(0, 6).toUpperCase()}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                            {p.category || '未分類'}
                          </span>
                          {/* <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              pat?.type === 'CHART'
                                ? 'border-purple-200 text-purple-500'
                                : 'border-blue-200 text-blue-500'
                            }`}
                          >
                            {pat?.type || 'TEXT'}
                          </span> */}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">
                        {title}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          !window.confirm(
                            '確定要刪除這個專案嗎？\n此動作無法復原。'
                          )
                        )
                          return;
                        onDeleteProject(p.id);
                      }}
                      className="text-gray-200 hover:text-red-400 p-1 transition-colors"
                    >
                      <Icons.Trash />
                    </button>
                  </div>

                  {/* 中段：目前部位 + 基本資訊 */}
                  <div className="flex gap-4">
                    {/* 左邊：封面色塊 */}
                    <div className="w-24 h-32 md:w-28 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden shadow-inner relative bg-theme-bg">
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        <KnittingIcon size={48} color='var(--primary-color)' />
                      </div>
                      {p.startAt && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/35 backdrop-blur-[2px] py-1 text-center">
                          <span className="text-[10px] text-white font-medium">
                            開始 {new Date(p.startAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      {/* 目前部位 + 目前部位排數 */}
                      <div
                        className="rounded-2xl p-2.5 space-y-2 border"
                        style={{
                          backgroundColor: 'var(--surface-color)',
                          borderColor: 'var(--border-soft-color)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-white rounded-lg shadow-sm text-theme-primary text-xs font-black">
                            部位
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">
                              目前部位
                            </p>
                            <p className="text-xs font-bold text-gray-700 truncate">
                              {currentPartName || '主體'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] text-gray-500">
                            目前排數
                          </span>
                          <span className="text-[10px] font-zen-mono font-bold text-theme-primary">
                            {displayDone}
                            {displayTarget ? ` / ${displayTarget}` : ''} 排
                          </span>
                        </div>
                      </div>

                      {/* Yarn / Needle / Cast on */}
                      <div className="grid grid-cols-1 gap-1 mt-2 px-1 text-[10px] text-gray-500">
                        {p.yarnId && (
                          <div className="truncate">
                            線材：{findYarnLabel(p.yarnId)}
                          </div>
                        )}
                        {p.needle && (
                          <div className="truncate">針號：{p.needle}</div>
                        )}
                        {p.castOn && (
                          <div className="truncate">起針：{p.castOn}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 底部：總進度區 */}
                  {ratio !== null && plannedRows !== null && (
                    <div className="bg-theme-text rounded-2xl p-4 text-white shadow-md">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">
                            Overall Progress
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-zen-mono font-bold leading-none">
                              {doneRows}
                            </span>
                            <span className="text-[9px] text-white/60">
                              / {plannedRows} 總排數
                            </span>
                          </div>
                        </div>
                        {overallPercent !== null && (
                          <span className="text-xl font-black opacity-90">
                            {overallPercent}%
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-theme-primary rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-700"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}

          {displayList.length === 0 && (
            <div className="col-span-full text-center py-24 border-2 border-dashed border-gray-100 rounded-[40px]">
              <div className="text-4xl mb-4 opacity-20">
                {activeTab === 'ONGOING' ? '☕️' : '📦'}
              </div>
              <p className="opacity-30 font-black tracking-widest uppercase text-xs">
                {activeTab === 'ONGOING' ? '目前沒有進行中的專案' : '尚無已完成的紀錄'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentProject || !currentPattern) return null;

  const projectTitle =
    currentProject.projectName || currentProject.patternName;

  return (
    <div className="h-full flex flex-col bg-theme-bg relative overflow-hidden">
      {/* 1️⃣ 上方標題列：略縮一點高度 */}
      <div className="flex-none bg-white/80 backdrop-blur px-4 py-3 border-b flex items-center justify-between z-20 shadow-sm">
        {/* Left：返回 */}
        <button
          onClick={() => setSelectedId(null)}
          className="text-gray-400 font-bold px-2 uppercase text-[10px] tracking-[0.18em]"
        >
          ← Back
        </button>

        {/* Middle：織品標題（點擊打開 project info modal） */}
        <button
          onClick={() => setActiveModal('project')}
          className="flex flex-col items-center justify-center max-w-xs px-2 group"
        >
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/40 flex items-center gap-1">
            Project Info
            <span className="text-[10px] group-hover:text-theme-primary transition-colors">
              ⓘ
            </span>
          </span>
          <h2 className="font-black text-theme-text truncate text-sm tracking-tight group-hover:text-theme-primary transition-colors">
            {projectTitle}
          </h2>
        </button>

        {/* Right：右上角功能按鈕 */}
        <div className="flex items-center gap-2">
          {/* Instruction 按鈕 */}
          <button
            onClick={() => setActiveModal('instruction')}
            className="inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-full bg-theme-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-md shadow-theme-primary/20 hover:brightness-110 transition-all"
          >
            <Icons.ScrollText size={14} />
            <span className="hidden sm:inline">織圖</span>
          </button>

          {/* Notes 按鈕 */}
          <button
            onClick={() => setActiveModal('notes')}
            className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-theme-bg/60 shadow-sm hover:bg-theme-bg transition-colors"
          >
            <Icons.StickyNote size={18} className="text-theme-text/80" />
          </button>
        </div>
      </div>

      {/* 2️⃣ 中間主內容：無捲軸版本 */}
      <div className="flex-1 flex flex-col px-4 md:px-10 pt-3 pb-2 gap-3 overflow-hidden">
        {/* 部位切換按鈕列 */}
        {currentProject.partsProgress && currentProject.partsProgress.length > 0 && (
          <div className="sticky top-0 z-30 -mx-4 bg-transparent">
            <div className="flex overflow-x-auto no-scrollbar flex-nowrap gap-2 p-3">
              {currentProject.partsProgress.map((part) => {
                const isActive =
                  currentPartProgress && part.partId === currentPartProgress.partId;

                return (
                  <button
                    key={part.partId}
                    onClick={() =>
                      onUpdateProject({
                        ...currentProject,
                        currentPartId: part.partId,
                        totalRow: part.totalRow || 1,
                        sectionRow: part.sectionRow || 1,
                      })
                    }
                    className={
                      'flex-none flex-shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition ' +
                      (isActive
                        ? 'bg-theme-primary text-white shadow'
                        : 'bg-theme-bg text-theme-text/60 hover:bg-theme-bg/80')
                    }
                  >
                    {part.name || '主體'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2️⃣ 提醒區：固定高度容器 + 絕對定位提醒卡片 */}
        <div className="relative flex-none h-16 md:h-18 rounded-[1.75rem]">
          {/* 沒提醒時的淡淡提示文字 */}
          {(!showAlertOverlay || currentAlerts.length === 0) && (
            <div className="h-full flex items-center justify-center text-[9px] tracking-[0.2em] uppercase text-theme-text/20">
              Row alerts will appear here
            </div>
          )}

          {/* 有提醒時：卡片浮在這個高度內，可略為蓋到下方 Panel */}
          {showAlertOverlay && currentAlerts.length > 0 && (
            <div className="absolute inset-0 z-20 pointer-events-none flex justify-center pt-[0%]">
              <div className="max-w-xl w-full px-2 sm:px-0 pointer-events-auto">
                <div className="animate-float-subtle bg-theme-primary text-white rounded-[1.5rem] shadow-2xl border border-white/30 px-3 py-2 flex items-start gap-2">
                  <div className="w-7 h-7 bg-white/15 rounded-2xl flex items-center justify-center text-base flex-shrink-0">
                    <Icons.Bell
                            size={18}
                            style={{ color: 'var(--primary-color)' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] opacity-70 mb-0.5 truncate">
                      Row Alert · {currentAlerts.length} rule
                      {currentAlerts.length > 1 ? 's' : ''} on this row
                    </div>

                    {/* 裡面文字高度限制，避免整張卡過高 */}
                    <div className="mt-0.5 space-y-2">
                      {currentAlerts.map((alert, idx) => (
                        <div
                          key={alert.id || idx}
                          className="flex items-start gap-1 text-[11px] leading-snug"
                        >
                          <span className="mt-[1px] text-[10px]">•</span>
                          <div className="min-w-0">
                            <div className="text-[9px] opacity-80 uppercase tracking-[0.12em] mb-0.5">
                              {alert.type === 'SECTION' ? 'Section' : 'Total'} ·{' '}
                              {alert.mode === 'EVERY' ? 'Every' : 'At'} {alert.value}
                            </div>
                            <div className="text-[11px] font-bold break-words">
                              {alert.message || '下一段變化來了～'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAlertOverlay(false)}
                    className="ml-1 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 transition flex-shrink-0"
                  >
                    關閉
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3️⃣ 下方 Panel：靠畫面底部，SECTION LOOP / CURRENTLY / ROW COUNTER 內容維持 */}
        <div className="flex-1 flex items-end justify-center overflow-hidden pb-safe">
          {currentPartProgress && (
            <div className="w-full max-w-5xl pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
              {/* 浮動當前指令（可選） */}
              {activeInstructionText && (
                <div
                  className="mb-2 bg-white/95 backdrop-blur rounded-[2rem] shadow-lg border border-theme-bg/60 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-theme-primary/10 flex items-center justify-center text-[11px] font-black text-theme-primary">
                      Now
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {activeInstruction?.title && (
                        <div className="text-[11px] font-semibold text-theme-text/70 mb-1">
                          {activeInstruction.title}
                        </div>
                      )}
                      <div
                        className="text-xs md:text-sm text-theme-text/90 whitespace-pre-wrap leading-relaxed"
                      >
                        {activeInstructionText}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 主要 Panel 外框（只改外觀與高度收斂） */}
              <div className="bg-white/98 backdrop-blur rounded-[2.5rem] border border-theme-accent/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden">
                {/* 頂部進度條 */}
                <div className="h-1.5 w-full bg-theme-bg overflow-hidden">
                  <div
                    className="h-full bg-theme-primary transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* 內層內容：Section Loop / Currently / Row Counter －－ 內部排版不動 */}
                <div className="p-4 md:px-8">
                  <div className="flex flex-col md:flex-row items-stretch gap-4">
                    {/* 左半：Section Loop + Currently（原樣） */}
                    <div className="flex-1 border-b md:border-b-0 md:border-r border-theme-bg/60 pb-3 md:pb-0 md:pr-4">
                      <div className="flex flex-row md:flex-col items-start justify-between gap-4">
                        {/* Section Loop */}
                        <div className="text-theme-text/70">
                          {sectionLoopInfo ? (
                          <>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/40 mb-1">
                              {sectionLoopInfo.isPatternMode ? 'Pattern Loop' : 'Section Loop'}
                            </div>
                            <div className={`border-l-2 pl-2 ${sectionLoopInfo.isPatternMode ? 'border-theme-accent' : 'border-theme-primary/20'}`}>
                              {sectionLoopInfo.title && (
                                <div className="text-xs font-bold text-theme-text truncate max-w-[120px] md:max-w-none">
                                  {sectionLoopInfo.title}
                                </div>
                              )}
                              <div className="text-[11px] md:text-xs text-theme-text/60 tabular-nums">
                                  第 <span className="font-semibold text-theme-text/90">{sectionLoopInfo.loopRow}</span>
                                  &nbsp;/&nbsp;
                                  <span className={sectionLoopInfo.isLastLoop ? "font-bold" : ""}>
                                    {sectionLoopInfo.rowsPerLoop}
                                  </span> 排
                                  <span className="mx-1 text-theme-text/30">|</span>
                                  第{" "}
                                  <span className="font-semibold text-theme-text/90">
                                    {sectionLoopInfo.loopIndex}
                                  </span>
                                  &nbsp;/&nbsp;
                                  <span className="text-theme-text/60">
                                    {sectionLoopInfo.totalLoops}
                                  </span>{" "}
                                  輪
                                </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] opacity-50">
                            尚未有 Section Loop 資訊
                          </div>
                        )}
                        </div>

                        {/* Currently */}
                        <div className="text-right md:text-left md:pl-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/40 mb-1 block">
                            Currently
                          </span>
                          <div className="text-[10px] font-bold text-theme-text tabular-nums">
                            {currentPartTitle && (
                              <span className="font-semibold mr-2">
                                {currentPartTitle}
                              </span>
                            )}
                            {typeof currentRow === 'number' &&
                              typeof totalRows === 'number' && (
                                <div className="text-[10px] text-theme-text/50">
                                  第 <span className="font-bold">{currentRow}</span>{' '}
                                  / {totalRows} 排
                                  <span className="mx-1 text-theme-text/30">•</span>
                                  進度 {progressPercent}%
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 右半：Row Counter（原樣） */}
                    <div className="w-full md:w-auto flex items-center justify-end">
                      <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text/40 self-start md:self-end">
                          Row Counter
                        </span>

                        <div className="flex items-center gap-2 w-full">
                          {/* - 按鈕 */}
                          <button
                            onClick={() => {
                              update(-1);
                              setShowAlertOverlay(false);
                            }}
                            className="w-12 h-12 rounded-full bg-theme-bg text-theme-primary font-black text-xl flex items-center justify-center active:scale-90 transition-transform shadow-inner"
                          >
                            −
                          </button>

                          {/* 當前排數 */}
                          <div className="flex-1 min-w-[70px] text-center">
                            <div className="text-5xl md:text-6xl font-black text-theme-text tabular-nums leading-none tracking-tighter">
                              {currentTotalRow}
                            </div>
                            <div className="text-[9px] font-bold text-theme-text/30 uppercase mt-1">
                              Rows
                            </div>
                          </div>

                          {/* + 按鈕 */}
                          <button
                            onClick={() => {
                              update(1);
                              setShowAlertOverlay(false);
                            }}
                            className="w-20 h-20 md:w-20 md:h-20 rounded-full bg-theme-primary text-white font-black text-3xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-theme-primary/30"
                          >
                            +
                          </button>

                          {/* +n Go */}
                          <div className="flex flex-col items-stretch gap-1 bg-theme-bg/60 rounded-2xl p-1 ml-1">
                            <input
                              type="number"
                              value={plusN}
                              onChange={(e) => setPlusN(e.target.value)}
                              placeholder="+n"
                              className="w-14 bg-transparent border-none text-center font-bold text-sm focus:ring-0 focus:outline-none tabular-nums placeholder:text-theme-text/20 p-1"
                            />
                            <button
                              onClick={() => {
                                const n = parseInt(plusN);
                                if (!isNaN(n)) {
                                  update(n);
                                  setShowAlertOverlay(false);
                                }
                                setPlusN('');
                              }}
                              className="px-2 py-1.5 rounded-xl font-black text-[9px] tracking-wider uppercase bg-theme-text text-white active:scale-95 transition-transform"
                            >
                              Go
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>{' '}
                {/* /p-4 */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ⬇️ 底下三個 Modal 區塊（project / instruction / notes）維持你原本的程式碼即可 */}
              {activeModal === 'project' && (
        <Modal
          title="織品資訊"
          onClose={() => setActiveModal(null)}
          icon={Icons.Sparkles}
        >
          <div className="space-y-4">
            {/* 名稱 + 開始日期 */}
            <div className="flex justify-between items-end gap-3">
              <div className="flex-1">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/50 mb-1">
                  Project Name
                </div>
                <input
                  type="text"
                  value={currentProject.projectName || ''}
                  onChange={(e) =>
                    onUpdateProject({
                      ...currentProject,
                      projectName: e.target.value,
                    })
                  }
                  className="w-full bg-theme-bg/40 rounded-xl border-none text-base font-black tracking-tight px-3 py-2 focus:ring-2 ring-theme-primary/30"
                  placeholder="給這個作品取一個名字…"
                />
              </div>
              {currentProject.startAt && (
                <div className="text-right text-[9px] text-theme-text/50 uppercase tracking-[0.18em]">
                  Started
                  <br />
                  <span className="font-black text-theme-text/80">
                    {new Date(currentProject.startAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/50">
                Category
              </span>
              <select
                className="bg-theme-bg/70 rounded-full px-3 py-1.5 border-none text-[10px]"
                value={currentProject.category || '未分類'}
                onChange={(e) =>
                  onUpdateProject({
                    ...currentProject,
                    category: e.target.value,
                  })
                }
              >
                {(categories || ['未分類']).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Yarn / Needle / Cast On */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-theme-text/70">
              <div className="flex items-center gap-1">
                <span className="font-black uppercase tracking-[0.2em]">
                  Yarn
                </span>
                <select
                  className="bg-theme-bg/60 rounded-full px-3 py-1 border-none text-[10px]"
                  value={currentProject.yarnId || ''}
                  onChange={(e) =>
                    onUpdateProject({
                      ...currentProject,
                      yarnId: e.target.value || null,
                    })
                  }
                >
                  <option value="">未選擇</option>
                  {yarns.map((y) => (
                    <option key={y.id} value={y.id}>
                      {[y.brand, y.name].filter(Boolean).join(' ') || '未命名線材'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="uppercase tracking-[0.2em] font-black opacity-60">
                  Needle
                </span>
                <input
                  className="bg-theme-bg/60 rounded-full px-3 py-1 border-none text-[10px] w-24"
                  placeholder="4.0mm"
                  value={currentProject.needle || ''}
                  onChange={(e) =>
                    onUpdateProject({
                      ...currentProject,
                      needle: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="uppercase tracking-[0.2em] font-black opacity-60">
                  Cast on
                </span>
                <input
                  className="bg-theme-bg/60 rounded-full px-3 py-1 border-none text-[10px] w-24"
                  placeholder="例如 112"
                  value={currentProject.castOn || ''}
                  onChange={(e) =>
                    onUpdateProject({
                      ...currentProject,
                      castOn: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Modal>
        )}

        {activeModal === 'instruction' && (
        <Modal
          title="Instruction"
          onClose={() => setActiveModal(null)}
          icon={Icons.Library}
        >
          <div className="space-y-4">
            {/* Instruction 內容（沿用你原本的邏輯） */}
            <div className="bg-white p-6 rounded-[2rem] shadow-cozy border border-white min-h-[260px]">
              {/* <h4 className="font-black text-theme-text border-b border-theme-bg pb-3 mb-4 flex items-center gap-3 tracking-widest uppercase text-[10px]">
                <Icons.Library /> Instruction
              </h4> */}
              {currentPattern.type === 'TEXT' ? (
                <div className="space-y-8">
                  {(projectStats.sectionsSummary || []).map((sec) => {
                    const isActive = projectStats.activeSection?.id === sec.id;
                    return (
                      <div
                        key={sec.id}
                        className={`relative pl-6 border-l-4 transition-all group ${
                          isActive
                            ? 'border-theme-primary scale-[1.02]'
                            : 'border-theme-bg opacity-40 grayscale'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                              isActive
                                ? 'bg-theme-primary text-white shadow-md'
                                : 'bg-theme-bg'
                            }`}
                          >
                            {sec.title}
                          </span>
                          <span className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">
                            {sec.rowsPerLoop} rows × {sec.repeats} times
                          </span>
                        </div>
                        <div
                          className={`font-zen-mono text-sm leading-relaxed whitespace-pre-wrap ${
                            isActive
                              ? 'text-theme-text font-bold'
                              : 'text-gray-400'
                          }`}
                        >
                          {sec.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {currentPattern.sections?.[0] && (
                    <div className="inline-block bg-white border-4 border-theme-bg rounded-2xl p-2 shadow-inner overflow-x-auto max-w-full">
                      <div
                        className="grid gap-[1px] bg-theme-accent/30"
                        style={{
                          gridTemplateColumns: `repeat(${currentPattern.sections[0].cols}, 24px)`,
                        }}
                      >
                        {currentPattern.sections[0].grid.map((row, r) =>
                          row.map((cell, c) => {
                            const localIdx =
                              (currentProject.sectionRow - 1) %
                              currentPattern.sections[0].rows;
                            const isHighlight =
                              r ===
                              currentPattern.sections[0].rows - 1 - localIdx;
                            return (
                              <div
                                key={`${r}-${c}`}
                                className={`w-6 h-6 flex items-center justify-center text-[10px] font-zen-mono select-none ${
                                  SYMBOLS[cell]?.color || 'bg-white'
                                } ${
                                  isHighlight
                                    ? 'ring-2 ring-theme-primary z-10 scale-110 shadow-lg'
                                    : 'opacity-40 grayscale'
                                }`}
                              >
                                {SYMBOLS[cell]?.symbol}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
        )}

        {activeModal === 'notes' && (
        <Modal
          title="Notes"
          onClose={() => setActiveModal(null)}
          icon={Icons.StickyNote}
        >
          {/* Pattern Notes */}
            {currentPattern.notes && (
              <div className="bg-theme-bg/40 p-4 rounded-[1.5rem] border border-theme-bg/60">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">
                  Pattern Notes
                </div>
                <div className="text-sm text-theme-text whitespace-pre-wrap leading-relaxed">
                  {currentPattern.notes}
                </div>
              </div>
            )}
          <div className="bg-theme-bg/40 p-4 rounded-[1.5rem] border border-theme-bg/60">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">
              Project Notes
            </div>
            <div className="text-sm text-theme-text whitespace-pre-wrap leading-relaxed">
              <textarea
              className="w-full mt-2 bg-theme-bg/40 rounded-2xl p-3.5 text-sm leading-relaxed border-none focus:ring-2 ring-theme-primary/20 min-h-[180px] resize-none"
              placeholder="例：第 35 排發現麻花偏緊，下次改 4.5mm 棒針；袖長預計多織 5cm。"
              value={currentProject.notes || ''}
              onChange={(e) =>
                onUpdateProject({
                  ...currentProject,
                  notes: e.target.value,
                })
              }
            />
            </div>
          </div>
        </Modal>
      )}
    </div>
    
  );
}

// === 織圖編輯器（含 pattern 備註） ===

function EditorView({ pattern, onUpdate, onBack, categories, yarns }) {
  const [data, setData] = useState({
    ...pattern,
    meta: {
      castOn: '',
      needle: '',
      yarnId: null,
      ...(pattern.meta || {}),
    },
  });
  const [activeTab, setActiveTab] = useState('CONTENT');
  const [selectedTool, setSelectedTool] = useState('KNIT');

  const [activePartId, setActivePartId] = useState(() => {
    if (pattern.parts && Array.isArray(pattern.parts) && pattern.parts.length) {
      return pattern.parts[0].id;
    }
    return null;
  });

  // 在 EditorView 元件內部的 useEffect 區域加入
  useEffect(() => {
    // 1. 處理右側主要內容區的重置
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    // 2. 如果你的主 container (main 標籤) 也可能帶有捲動偏移
    // 透過選擇器強制歸零，確保進入時畫面在最上方
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
    
    // 3. 針對視窗本身做最後防線
    window.scrollTo(0, 0);
  }, []); // 僅在元件掛載時執行一次

  useEffect(() => {
    if (!data.parts || !data.parts.length) return;
    if (!activePartId || !data.parts.some((p) => p.id === activePartId)) {
      setActivePartId(data.parts[0].id);
    }
  }, [data.parts, activePartId]);

  const currentPart = useMemo(() => {
    if (!data.parts || !data.parts.length) return null;
    return data.parts.find((p) => p.id === activePartId) || data.parts[0];
  }, [data.parts, activePartId]);

  const sectionsSource = currentPart?.textSections || [];
  const alertsSource = currentPart?.alerts || [];

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(true);

  const scrollContainerRef = useRef(null);
  const listEndRef = useRef(null);

  // useEffect(() => {
  //   onUpdate(data);
  // }, [data]);

  const totalRows = useMemo(() => {
    if (data.type !== 'TEXT') return 0;
    return sectionsSource.reduce(
      (sum, s) => sum + (s.rowsPerLoop || 1) * (s.repeats || 1),
      0
    );
  }, [data.type, sectionsSource]);

  const containerStyle = {
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-color)',
  };

  const categoryOptions = useMemo(() => {
    const base =
      Array.isArray(categories) && categories.length
        ? categories
        : ['圍巾', '毛帽', '毛衣', '襪子', '未分類'];
    if (!data.category) return base;
    return base.includes(data.category) ? base : [...base, data.category];
  }, [categories, data.category]);

  const yarnOptions = useMemo(
    () =>
      (yarns || []).map((y) => ({
        id: y.id,
        label: y.name || `${y.brand || ''} ${y.series || ''}`.trim() || '未命名線材',
      })),
    [yarns]
  );

  const createEmptyTextSection = () => ({
    id: crypto.randomUUID(),
    title: `段落 ${sectionsSource.length + 1}`,
    content: '',
    repeats: 1,
    rowsPerLoop: 1,
  });

  const ensureParts = () => {
    if (data.parts && data.parts.length > 0) return;
    const newPart = {
      id: crypto.randomUUID(),
      name: '主體',
      textSections: [createEmptyTextSection()],
      alerts: [],
    };
    setData((prev) => ({
      ...prev,
      parts: [newPart],
    }));
    setActivePartId(newPart.id);
  };

  useEffect(() => {
    ensureParts();
  }, []);

  const updateActivePart = (updater) => {
    if (!currentPart) return;
    setData((prev) => ({
      ...prev,
      parts: (prev.parts || []).map((p) =>
        p.id === currentPart.id ? updater(p) : p
      ),
    }));
  };

  const handleAddSection = () => {
    if (!currentPart) {
      ensureParts();
      return;
    }
    const nextSections = [
      ...sectionsSource,
      {
        id: crypto.randomUUID(),
        title: `段落 ${sectionsSource.length + 1}`,
        content: '',
        repeats: 1,
        rowsPerLoop: 1,
        patternRows: null, // 👈 新增：用於記錄花樣循環排數
      },
    ];
    updateActivePart((p) => ({ ...p, textSections: nextSections }));
    setTimeout(() => {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleDeletePart = (partId) => {
    if (
      !window.confirm(
        '確定要刪除此部位嗎？\n此部位的文字段落與提醒規則也會一併刪除。'
      )
    ) {
      return;
    }

    setData((prev) => {
      const currentParts = prev.parts || [];
      if (currentParts.length <= 1) return prev;

      const newParts = currentParts.filter((p) => p.id !== partId);

      let nextActiveId = prev.activePartId;
      if (!newParts.some((p) => p.id === nextActiveId)) {
        nextActiveId = newParts[0]?.id ?? null;
      }

      return {
        ...prev,
        parts: newParts,
        activePartId: nextActiveId,
      };
    });

    if (activePartId === partId && data.parts?.length > 1) {
      const rest = data.parts.filter((p) => p.id !== partId);
      setActivePartId(rest[0]?.id ?? null);
    }
  };

  const handleAddPart = () => {
    const parts = data.parts && data.parts.length ? data.parts : [];
    const defaultName = `部位 ${parts.length + 1}`;
    const input = window.prompt('請輸入新的部位名稱：', defaultName);
    const name = (input ?? '').trim() || defaultName;
    const newPart = {
      id: crypto.randomUUID(),
      name,
      textSections: [],
      alerts: [],
    };
    setData((prev) => ({
      ...prev,
      parts: [...(prev.parts || []), newPart],
    }));
    setActivePartId(newPart.id);
    setShowMobileSidebar(false);
  };

  const handleSaveAndBack = () => {
    onUpdate({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    onBack();
  };

  const addAlertRule = () => {
    if (!currentPart) return;
    const base = alertsSource;
    const nextAlerts = [
      ...base,
      {
        id: crypto.randomUUID(),
        value: 1,
        mode: 'SPECIFIC',
        type: 'TOTAL',
        sectionId: 'ALL',
        startFrom: 1,
        repeatCount: 2, // 👈 新增：只重複 5 次
        message: '',
      },
    ];
    updateActivePart((p) => ({
      ...p,
      alerts: nextAlerts,
    }));
  };

  const clonePatternToText = (patternSection) => {
    const lines = [];
    for (let r = 0; r < patternSection.rows; r++) {
      const rowTools = [];
      for (let c = 0; c < patternSection.cols; c++) {
        const cell = (patternSection.grid[r] && patternSection.grid[r][c]) || 'KNIT';
        const sym = SYMBOLS[cell];
        if (sym) {
          rowTools.push(sym.label);
        }
      }
      if (rowTools.length) {
        lines.push(`第 ${r + 1} 排：${rowTools.join('、')}`);
      }
    }
    return lines.join('\n');
  };

  const convertPatternToTextSection = (patternSection) => {
    const asText = clonePatternToText(patternSection);
    const newTextSec = {
      id: crypto.randomUUID(),
      title: patternSection.title || '轉換自圖示段落',
      content: asText,
      repeats: 1,
      rowsPerLoop: patternSection.rows || 1,
    };
    updateActivePart((p) => ({
      ...p,
      textSections: [...(p.textSections || []), newTextSec],
    }));
    setActiveTab('CONTENT');
  };

  const addPatternSection = () => {
    const base = data.sections || [];
    const newSection = {
      id: crypto.randomUUID(),
      title: `圖樣 ${base.length + 1}`,
      rows: 8,
      cols: 8,
      grid: Array.from({ length: 8 }, () =>
        Array.from({ length: 8 }, () => 'KNIT')
      ),
    };
    setData((prev) => ({
      ...prev,
      sections: [...base, newSection],
    }));
  };

  const updatePatternSection = (id, updater) => {
    setData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) =>
        s.id === id ? updater(s) : s
      ),
    }));
  };

  const removePatternSection = (id) => {
    setData((prev) => ({
      ...prev,
      sections: (prev.sections || []).filter((s) => s.id !== id),
    }));
  };

  const resizePatternSection = (id, rowsDelta, colsDelta) => {
    setData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) => {
        if (s.id !== id) return s;
        const nextRows = Math.max(1, (s.rows || 0) + rowsDelta);
        const nextCols = Math.max(1, (s.cols || 0) + colsDelta);

        const rs =
          nextRows > s.rows
            ? [
                ...s.grid,
                ...Array.from({ length: nextRows - s.rows }, () =>
                  Array.from({ length: s.cols }, () => 'KNIT')
                ),
              ]
            : s.grid.slice(0, nextRows);

        const cs =
          nextCols > s.cols
            ? rs.map((row) => [
                ...row,
                ...Array.from({ length: nextCols - s.cols }, () => 'KNIT'),
              ])
            : rs.map((row) => row.slice(0, nextCols));

        const grid = cs;
        return { ...s, rows: rs.length, cols: cs[0]?.length || 0, grid };
      }),
    }));
  };

  const toggleCell = (sid, r, c) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sid
          ? {
              ...s,
              grid: s.grid.map((row, ri) =>
                ri === r
                  ? row.map((cell, ci) => (ci === c ? selectedTool : cell))
                  : row
              ),
            }
          : s
      ),
    }));
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // 限制最大寬度以節省空間
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // 使用 jpeg 格式並設置 0.7 的品質來大幅壓縮體積
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
      };
    });
  };

  return (
    <div
      style={containerStyle}
      className="flex flex-col h-screen pb-safe overflow-hidden animate-fade-in font-sans transition-colors duration-500"
    >
      {/* 頂部導覽列 */}
      <header className="h-16 px-4 md:px-6 bg-white/95 backdrop-blur border-b border-gray-100 flex justify-between items-center z-40 shadow-sm">
        {/* 左：返回 + 標題 */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-50 rounded-full text-gray-400"
          >
            <Icons.X size={20} />
          </button>
          <div className="hidden md:block h-4 w-[1px] bg-gray-200" />
          <h2 className="text-sm font-black tracking-tight truncate max-w-[120px] md:max-w-[220px]">
            {data.name || '未命名織圖'}
          </h2>
        </div>

        {/* 中：內容 / 提醒 Tab 切換（膠囊樣式） */}
        <div
          className="flex p-1 rounded-2xl shadow-inner"
          style={{ backgroundColor: 'var(--accent-color)' }}
        >
          <button
            onClick={() => setActiveTab('CONTENT')}
            className={`px-3 md:px-6 py-1.5 text-[10px] font-black rounded-xl transition-all ${
              activeTab === 'CONTENT'
                ? 'bg-white shadow'
                : 'opacity-40'
            }`}
            style={{
              color:
                activeTab === 'CONTENT'
                  ? 'var(--text-color)'
                  : 'var(--text-color)',
            }}
          >
            edit
          </button>
          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-3 md:px-6 py-1.5 text-[10px] font-black rounded-xl transition-all ${
              activeTab === 'ALERTS'
                ? 'bg-white shadow'
                : 'opacity-40'
            }`}
            style={{
              color:
                activeTab === 'ALERTS'
                  ? 'var(--text-color)'
                  : 'var(--text-color)',
            }}
          >
            alert
          </button>
        </div>

        {/* 右：手機設定抽屜按鈕 + Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden p-2 rounded-full"
            style={{ color: 'var(--text-color)' }}
          >
            <Icons.Menu size={20} />
          </button>
          <button
            onClick={handleSaveAndBack}
            className="flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] shadow-md hover:scale-105 transition-all"
            style={{
              backgroundColor: 'var(--primary-color)',
              color: '#ffffff',
            }}
          >
            <Icons.Check size={14} className="md:hidden" />
            <span className="hidden md:inline">Save</span>
            <span className="md:hidden">Done</span>
          </button>
        </div>
      </header>

      {/* 主區域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側設定 / 部位 / 備註 */}
        <aside
          className={`
            fixed inset-0 z-50 md:relative md:z-0 md:w-80
            bg-white border-r border-gray-100
            md:flex md:flex-col
            transition-transform duration-300
            ${
              showMobileSidebar
                ? 'translate-x-0'
                : '-translate-x-full md:translate-x-0'
            }
          `}
        >
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* 手機抽屜 header */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <span className="text-[11px] font-black tracking-[0.2em] uppercase opacity-60">
                Pattern Settings
              </span>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Icons.X size={18} />
              </button>
            </div>

            <div className="p-6 pb-safe flex-1 overflow-y-auto no-scrollbar space-y-8">
              {/* 基礎資訊 */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2 opacity-40">
                  <Icons.Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em]">
                    Settings
                  </span>
                </div>

                <div>
                  <label className="text-[9px] font-black opacity-40 uppercase tracking-[0.25em] block mb-1">
                    Pattern Design
                  </label>
                  <input
                    type="text"
                    value={data.name || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full text-lg md:text-xl font-black bg-transparent border-none p-0 focus:ring-0 tracking-tight"
                    placeholder="設計標題..."
                    style={{ color: 'var(--text-color)' }}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black opacity-40 uppercase tracking-[0.25em] block mb-1">
                    Category
                  </label>
                  <select
                    className="w-full rounded-xl px-3 py-2 text-[11px] font-bold border-none focus:ring-2 text-sm"
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)',
                    }}
                    value={data.category || '未分類'}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 總排數（文字織圖時顯示） */}
                {data.type === 'TEXT' && (
                  <div className="pt-2">
                    <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.25em]">
                      總排數計算
                    </div>
                    <div
                      className="text-2xl font-black tabular-nums tracking-tight"
                      style={{ color: 'var(--primary-color)' }}
                    >
                      {totalRows} 排
                    </div>
                  </div>
                )}

                {/* 起針 / 針號 / 線材 */}
                {/* <div className="grid grid-cols-1 gap-3 pt-2">
                  <div>
                    <label className="text-[9px] font-black opacity-40 uppercase tracking-[0.25em] block mb-1">
                      Cast On 起針數
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl px-3 py-2 text-[11px] border-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                      value={data.meta.castOn || ''}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          meta: {
                            ...prev.meta,
                            castOn: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black opacity-40 uppercase tracking-[0.25em] block mb-1">
                      Needle 針號
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl px-3 py-2 text-[11px] border-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                      value={data.meta.needle || ''}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          meta: {
                            ...prev.meta,
                            needle: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black opacity-40 uppercase tracking-[0.25em] block mb-1">
                      Yarn 線材
                    </label>
                    <select
                      className="w-full rounded-xl px-3 py-2 text-[11px] border-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                      value={data.meta.yarnId || ''}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          meta: {
                            ...prev.meta,
                            yarnId: e.target.value || null,
                          },
                        }))
                      }
                    >
                      <option value="">未指定</option>
                      {yarnOptions.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div> */}
              </section>

              {/* 部位列表 */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.25em]">
                      Parts / 部位
                    </div>
                    <div className="text-[11px] text-theme-text/60">
                      例如：前片、後片、左袖、右袖…
                    </div>
                  </div>
                  <button
                    onClick={handleAddPart}
                    className="text-[10px] px-3 py-1 rounded-full font-black tracking-[0.16em] uppercase shadow-sm"
                    style={{
                      backgroundColor: 'var(--primary-color)',
                      color: '#ffffff',
                    }}
                  >
                    + Add Part
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {(data.parts || []).map((part) => {
                    const isActive = activePartId === part.id;
                    const totalParts = data.parts?.length || 0;
                    return (
                      <div
                        key={part.id}
                        className="flex items-center gap-1 mt-1 group"
                      >
                        <button
                          onClick={() => {
                            setActivePartId(part.id);
                            setShowMobileSidebar(false);
                          }}
                          className={`flex-1 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition-all ${
                            isActive
                              ? 'shadow-md'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: isActive
                              ? 'var(--primary-color)'
                              : 'var(--bg-color)',
                            color: isActive ? '#ffffff' : 'var(--text-color)',
                          }}
                        >
                          {part.name}
                        </button>
                        {totalParts > 1 && (
                          <button
                            onClick={() => handleDeletePart(part.id)}
                            className="text-[11px] text-red-300 hover:text-red-500 px-1 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="刪除此部位"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 目前部位名稱可即時修改 */}
                {currentPart && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-[0.25em]">
                      部位名稱
                    </span>
                    <input
                      className="flex-1 rounded-full px-3 py-1.5 text-[11px] border-none focus:ring-2 text-sm"
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                      value={currentPart.name || ''}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setData((prev) => ({
                          ...prev,
                          parts: (prev.parts || []).map((p) =>
                            p.id === currentPart.id ? { ...p, name: newName } : p
                          ),
                        }));
                      }}
                      placeholder="例如：前片／後片／左袖…"
                    />
                  </div>
                )}
              </section>

              {/* 在 Aside 的 Settings 區段內，Pattern Design 輸入框上方或下方加入 */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2 opacity-40">
                  <Icons.Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em]">Cover Image</span>
                </div>

                <div className="relative group/cover aspect-[4/5] w-full rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  {data.coverImage ? (
                    <>
                      <img src={data.coverImage} className="w-full h-full object-cover" alt="Cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => document.getElementById('cover-upload').click()}
                          className="p-2 bg-white rounded-full text-gray-700 hover:text-theme-primary"
                        >
                          <Icons.Library size={18} />
                        </button>
                        <button 
                          onClick={() => setData(prev => ({ ...prev, coverImage: null }))}
                          className="p-2 bg-white rounded-full text-red-500"
                        >
                          <Icons.Trash size={18} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button 
                      onClick={() => document.getElementById('cover-upload').click()}
                      className="flex flex-col items-center gap-2 text-gray-400 hover:text-theme-primary transition-colors"
                    >
                      <Icons.Plus size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Upload Cover</span>
                    </button>
                  )}
                  <input 
                    id="cover-upload"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          // 現在可以安全地使用 await 了
                          const compressedBase64 = await compressImage(file);
                          setData(prev => ({ ...prev, coverImage: compressedBase64 }));
                        } catch (error) {
                          console.error("圖片壓縮失敗:", error);
                        }
                      }
                    }}
                  />
                </div>
                
                {/* 原有的 Pattern Design Input ... */}
              </section>

              {/* 備註（可收闔） */}
              <section
                className="flex-shrink-0 rounded-2xl p-4 border space-y-2 "
                style={{
                  backgroundColor: 'var(--bg-color)',
                  borderColor: 'var(--accent-color)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsNotesOpen((v) => !v)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Icons.StickyNote
                      size={14}
                      style={{ color: 'var(--primary-color)' }}
                    />
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.22em]"
                      style={{ color: 'var(--primary-color)' }}
                    >
                      Pattern Notes
                    </span>
                  </div>
                  {isNotesOpen ? <Icons.ChevronUp size={12} /> : <Icons.ChevronDown size={12} />}
                </button>
                {isNotesOpen && (
                  <textarea
                    className="w-full bg-transparent border-none p-0 text-[11px] leading-relaxed focus:ring-0 min-h-[100px] resize-none opacity-80 mt-2"
                    placeholder="例：M 號在第 18 排多加 2 針、袖子在麻花段前多編 6 排。"
                    value={data.notes || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    style={{ color: 'var(--text-color)' }}
                  />
                )}
              </section>
              
              {/* ✅ 專門給手機版捲動用的透明墊片，電腦版 (md:) 隱藏 */}
              <div className="h-20 md:hidden" />
            </div>
          </div>
        </aside>

        {/* 右：內容工作區 */}
        <main className="flex-1 flex flex-col overflow-hidden relative">

          {/* 內容捲動區 */}
          <div
            className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 md:px-10 md:pb-10 space-y-8"
            ref={scrollContainerRef}
          >
            {/* 行動端：部位橫向選單 */}
            <div className="md:hidden sticky top-0 z-30 -mx-4 bg-white/95 backdrop-blur border-b border-gray-100">
              <div className="flex overflow-x-auto no-scrollbar gap-2 p-3">
                {(data.parts || []).map((part) => (
                  <button
                    key={part.id}
                    onClick={() => setActivePartId(part.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                      activePartId === part.id
                        ? 'shadow-md'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor:
                        activePartId === part.id
                          ? 'var(--primary-color)'
                          : 'var(--bg-color)',
                      color:
                        activePartId === part.id
                          ? '#ffffff'
                          : 'var(--text-color)',
                    }}
                  >
                    {part.name}
                  </button>
                ))}
              </div>
            </div>
            {/* 吸頂工作區標頭 */}
            {/* <div className="sticky top-[56px] md:top-0 z-20 -mx-4 md:mx-0 pt-2 md:pt-10 pb-3 mb-3 bg-gradient-to-b from-[rgba(255,255,255,0.96)] to-[rgba(255,255,255,0)] backdrop-blur">
              <div className="px-4 md:px-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="hidden md:flex items-center gap-4">
                  <div
                    className="p-3 rounded-2xl shadow-sm border"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'var(--accent-color)',
                    }}
                  >
                    <Icons.Layers
                      size={20}
                      style={{ color: 'var(--primary-color)' }}
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-[0.25em]">
                      Currently Editing
                    </span>
                    <input
                      className="text-xl md:text-2xl font-black bg-transparent border-none p-0 focus:ring-0 block tracking-tight"
                      value={currentPart?.name || ''}
                      onChange={(e) =>
                        updateActivePart((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      style={{ color: 'var(--text-color)' }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddSection}
                  className="flex items-center justify-center gap-2 px-5 md:px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.18em] shadow-lg transition-all hover:scale-105"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: '#ffffff',
                    boxShadow: '0 10px 25px -6px var(--primary-color)',
                  }}
                >
                  <Icons.Plus size={16} />
                  <span>新增段落</span>
                </button> 
              </div>
            </div> */}

            {/* 內容 / 提醒 Tab */}
            {activeTab === 'CONTENT' ? (
              <div className="space-y-8">
                {/* 文字織圖段落卡片 */}
                {sectionsSource.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="bg-white rounded-[3rem] border shadow-cozy overflow-hidden group animate-fade-in"
                    style={{ borderColor: 'var(--accent-color)' }}
                  >
                    <div
                      className="px-6 md:px-8 py-4 md:py-5 border-b flex items-center justify-between gap-4"
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        borderColor: 'var(--accent-color)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border"
                          style={{
                            backgroundColor: '#ffffff',
                            borderColor: 'var(--accent-color)',
                            color: 'var(--text-color)',
                          }}
                        >
                          {idx + 1}
                        </span>
                        <input
                          value={sec.title || ''}
                          onChange={(e) =>
                            updateActivePart((p) => ({
                              ...p,
                              textSections: (p.textSections || []).map((s) =>
                                s.id === sec.id ? { ...s, title: e.target.value } : s
                              ),
                            }))
                          }
                          className="bg-transparent font-black text-sm md:text-base focus:ring-0 border-none p-0 tracking-tight uppercase"
                          placeholder="段落標題"
                          style={{ color: 'var(--text-color)' }}
                        />
                      </div>
                      <button
                        onClick={() =>
                          updateActivePart((p) => ({
                            ...p,
                            textSections: (p.textSections || []).filter(
                              (s) => s.id !== sec.id
                            ),
                          }))
                        }
                        className="text-red-300 hover:text-red-500 p-2 opacity-40 group-hover:opacity-100 transition-opacity"
                      >
                        <Icons.Trash2 size={16} />
                      </button>
                    </div>

                    {/* 排數設定區 */}
                    <div className="px-6 md:px-8 pt-5 pb-2 md:pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        <div
                          className="rounded-2xl p-4 shadow-sm space-y-1"
                          style={{
                            backgroundColor: 'var(--bg-color)',
                            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
                          }}
                        >
                          <label className="text-[9px] font-black opacity-40 uppercase block mb-1">
                            循環排數 Rows/Loop
                          </label>
                          <input
                            type="number"
                            value={sec.rowsPerLoop || 0}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 0;
                              updateActivePart((p) => ({
                                ...p,
                                textSections: (p.textSections || []).map((s) =>
                                  s.id === sec.id
                                    ? { ...s, rowsPerLoop: v }
                                    : s
                                ),
                              }));
                            }}
                            className="w-full text-xl md:text-2xl font-black border-none p-0 focus:ring-0 tabular-nums bg-transparent"
                            style={{ color: 'var(--text-color)' }}
                          />
                        </div>
                        <div
                          className="rounded-2xl p-4 shadow-sm space-y-1"
                          style={{
                            backgroundColor: 'var(--bg-color)',
                            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
                          }}
                        >
                          <label className="text-[9px] font-black opacity-40 uppercase block mb-1">
                            重複次數 Repeats
                          </label>
                          <input
                            type="number"
                            value={sec.repeats || 0}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 0;
                              updateActivePart((p) => ({
                                ...p,
                                textSections: (p.textSections || []).map((s) =>
                                  s.id === sec.id
                                    ? { ...s, repeats: v }
                                    : s
                                ),
                              }));
                            }}
                            className="w-full text-xl md:text-2xl font-black border-none p-0 focus:ring-0 tabular-nums bg-transparent"
                            style={{ color: 'var(--text-color)' }}
                          />
                        </div>

                        {/* 新增：花樣循環 (Pattern Cycle) */}
                        <div className="rounded-2xl p-4 shadow-sm bg-theme-bg border-2 border-dashed border-theme-primary/20">
                          <label className="text-[9px] font-black color-theme-primary uppercase block mb-1">
                            花樣循環 (選填)
                          </label>
                          <input 
                            type="number" 
                            placeholder="none"
                            value={sec.patternRows || ''} 
                            onChange={(e) => {
                              // 如果輸入為空則設為 null
                              const v = e.target.value === '' ? null : parseInt(e.target.value) || 0;
                              
                              // 使用你原本的 updateActivePart 模式
                              updateActivePart((p) => ({
                                ...p,
                                textSections: (p.textSections || []).map((s) =>
                                  s.id === sec.id ? { ...s, patternRows: v } : s
                                ),
                              }));
                            }}
                            className="w-full text-xl md:text-2xl font-black border-none p-0 focus:ring-0 tabular-nums bg-transparent"
                            style={{ color: sec.patternRows ? 'var(--primary-color)' : 'var(--text-color)' }}
                          />
                        </div>
                        <div
                          className="flex flex-col justify-center rounded-2xl px-4 shadow-inner"
                          style={{
                            backgroundColor: 'var(--surface-color)', // 或 var(--surface-strong-color)
                            boxShadow: 'inset 0 0 0 1px var(--border-soft-color)',
                          }}
                        >
                          <span className="text-[9px] font-black opacity-40 uppercase mb-1">
                            Total
                          </span>
                          <div className="text-lg font-black opacity-60 tabular-nums">
                            {Number(sec.rowsPerLoop || 0) *
                              Number(sec.repeats || 0)}{' '}
                            <span className="text-[10px]">Rows</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* 文字內容區 */}
                    <div className="px-6 md:px-8 pb-6 md:pb-8">
                      <textarea
                        value={sec.content || ''}
                        onChange={(e) =>
                          updateActivePart((p) => ({
                            ...p,
                            textSections: (p.textSections || []).map((s) =>
                              s.id === sec.id
                                ? { ...s, content: e.target.value }
                                : s
                            ),
                          }))
                        }
                        className="w-full min-h-[120px] md:min-h-[140px] rounded-3xl mt-2 px-4 py-3 text-sm leading-relaxed border-none focus:ring-2 resize-none font-mono"
                        placeholder="輸入此段落的編織說明..."
                        style={{
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* 底部：快速新增下一段落 */}
                <button
                  onClick={handleAddSection}
                  className="w-full py-8 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 group transition-all"
                  style={{
                    borderColor: 'var(--accent-color)',
                    color: 'var(--text-color)',
                    backgroundColor: 'var(--surface-glass-color)', // 讓你在午夜也不會白爆
                  }}
                >
                  <Icons.Plus
                    size={24}
                    className="opacity-60 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">
                    Add Next Section
                  </span>
                </button>
              </div>
            ) : (
              /* 提醒規則 TAB */
              <div className="space-y-8 animate-fade-in">
                {/*<div className="flex justify-between items-center px-1 md:px-0">
                  <h3 className="font-black text-xl tracking-tight opacity-70">
                    Smart Notifications
                  </h3>
                  <button
                    onClick={addAlertRule}
                    className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.16em] shadow-lg transition-all hover:scale-105"
                    style={{
                      backgroundColor: 'var(--primary-color)',
                      color: '#ffffff',
                      boxShadow: '0 10px 24px -6px var(--primary-color)',
                    }}
                  >
                    + Add New Rule
                  </button>
                </div>*/}
                <div className="grid gap-6">
                  {alertsSource.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white p-7 md:p-9 rounded-[3rem] shadow-cozy border-2 flex flex-col gap-6 group transition-all"
                      style={{ borderColor: 'var(--accent-color)' }}
                    >
                      <div className="flex flex-wrap gap-4 items-center">
                        {/* 模式 */}
                        <select
                          value={a.mode || 'SPECIFIC'}
                          onChange={(e) => {
                            const mode = e.target.value;
                            updateActivePart((p) => ({
                              ...p,
                              alerts: (p.alerts || []).map((rule) =>
                                rule.id === a.id ? { ...rule, mode } : rule
                              ),
                            }));
                          }}
                          className="text-[10px] font-black px-3.5 py-3 rounded-xl border-none uppercase tracking-[0.16em]"
                          style={{
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                          }}
                        >
                          <option value="SPECIFIC">第幾排提醒 (Once)</option>
                          <option value="EVERY">每幾排提醒 (Interval)</option>
                        </select>

                        {/* 起始排（EVERY 才顯示） */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {a.mode === 'EVERY' && (
                            <>
                              <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.16em]">
                                從第
                              </span>
                              <input
                                type="number"
                                value={
                                  typeof a.startFrom === 'number'
                                    ? a.startFrom
                                    : a.value || 1
                                }
                                onChange={(e) => {
                                  const v = parseInt(e.target.value) || 1;
                                  updateActivePart((p) => ({
                                    ...p,
                                    alerts: (p.alerts || []).map((rule) =>
                                      rule.id === a.id
                                        ? { ...rule, startFrom: v }
                                        : rule
                                    ),
                                  }));
                                }}
                                className="w-16 text-center font-black border-none tabular-nums rounded-xl px-2 py-1.5 focus:ring-2"
                                style={{
                                  backgroundColor: 'var(--bg-color)',
                                  color: 'var(--text-color)',
                                }}
                              />
                              <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.16em]">
                                排開始，
                              </span>
                            </>
                          )}

                          {/* 每幾排 / 第幾排 */}
                          <input
                            type="number"
                            value={a.value || 1}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 1;
                              updateActivePart((p) => ({
                                ...p,
                                alerts: (p.alerts || []).map((rule) =>
                                  rule.id === a.id ? { ...rule, value: v } : rule
                                ),
                              }));
                            }}
                            className="w-20 text-center font-black border-none tabular-nums rounded-xl px-2 py-1.5 focus:ring-2"
                            style={{
                              backgroundColor: 'var(--bg-color)',
                              color: 'var(--text-color)',
                            }}
                          />
                          <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.16em]">
                            {a.mode === 'EVERY' ? '排為間隔' : '排'}
                          </span>

                          {/* 新增：重複次數（僅 EVERY 模式顯示） */}
                          {a.mode === 'EVERY' && (
                            <>
                              <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.16em] ml-2">
                                ，重複
                              </span>
                              <input
                                type="number"
                                placeholder="∞"
                                value={a.repeatCount || ''}
                                onChange={(e) => {
                                  // 如果清空則設為 null 或 undefined，代表無限循環
                                  const v = e.target.value === '' ? null : parseInt(e.target.value);
                                  updateActivePart((p) => ({
                                    ...p,
                                    alerts: (p.alerts || []).map((rule) =>
                                      rule.id === a.id ? { ...rule, repeatCount: v } : rule
                                    ),
                                  }));
                                }}
                                className="w-16 text-center font-black border-none tabular-nums rounded-xl px-2 py-1.5 focus:ring-2"
                                style={{
                                  backgroundColor: 'var(--bg-color)',
                                  color: 'var(--text-color)',
                                }}
                              />
                              <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.16em]">
                                次
                              </span>
                            </>
                          )}
                        </div>

                        {/* 文字區段限制（僅 TEXT 顯示） */}
                        {data.type === 'TEXT' && (
                          <select
                            value={a.sectionId || 'ALL'}
                            onChange={(e) => {
                              const sectionId = e.target.value;
                              updateActivePart((p) => ({
                                ...p,
                                alerts: (p.alerts || []).map((rule) =>
                                  rule.id === a.id ? { ...rule, sectionId } : rule
                                ),
                              }));
                            }}
                            className="text-[10px] font-black px-3.5 py-3 rounded-xl border-none uppercase tracking-[0.16em] ml-auto min-w-[140px]"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, transparent)',
                              color: 'var(--primary-color)',
                            }}
                          >
                            <option value="ALL">適用所有區段</option>
                            {sectionsSource.map((sec) => (
                              <option key={sec.id} value={sec.id}>
                                限：{sec.title || '未命名段落'}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* 類型 */}
                        <select
                          value={a.type || 'TOTAL'}
                          onChange={(e) => {
                            const type = e.target.value;
                            updateActivePart((p) => ({
                              ...p,
                              alerts: (p.alerts || []).map((rule) =>
                                rule.id === a.id ? { ...rule, type } : rule
                              ),
                            }));
                          }}
                          className="text-[10px] font-black px-3.5 py-3 rounded-xl border-none uppercase tracking-[0.16em]"
                          style={{
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                          }}
                        >
                          <option value="TOTAL">累計總排數</option>
                          <option value="SECTION">區段/花樣段</option>
                        </select>

                        {/* 刪除提醒 */}
                        <button
                          onClick={() =>
                            updateActivePart((p) => ({
                              ...p,
                              alerts: (p.alerts || []).filter(
                                (rule) => rule.id !== a.id
                              ),
                            }))
                          }
                          className="text-red-300 p-2 opacity-30 group-hover:opacity-100 transition-opacity"
                        >
                          <Icons.Trash2 size={16} />
                        </button>
                      </div>

                      {/* 提醒訊息輸入框 */}
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">
                          <Icons.Bell
                            size={18}
                            style={{ color: 'var(--primary-color)' }}
                          />
                        </div>
                        <input
                          value={a.message || ''}
                          onChange={(e) => {
                            const msg = e.target.value;
                            updateActivePart((p) => ({
                              ...p,
                              alerts: (p.alerts || []).map((rule) =>
                                rule.id === a.id ? { ...rule, message: msg } : rule
                              ),
                            }));
                          }}
                          className="w-full pl-12 pr-5 py-4 rounded-[2rem] border-none focus:ring-2 text-sm font-bold"
                          placeholder="提醒內容（例如：該扭麻花了、該加一針了…）"
                          style={{
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {/* 底部：快速新增下一段落 */}
                  <button
                    onClick={addAlertRule}
                    className="w-full py-8 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 group transition-all"
                    style={{
                      borderColor: 'var(--accent-color)',
                      color: 'var(--text-color)',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <Icons.Plus
                      size={24}
                      className="opacity-60 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">
                      Add Next Rule
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div ref={listEndRef} className="h-20" />
          </div>
        </main>
      </div>

      {/* 行動端底部：進度 & Quick Save */}
      {/*<div className="md:hidden h-14 bg-white border-t border-gray-100 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black opacity-40 uppercase tracking-[0.16em]">
            Progress
          </span>
          <span
            className="text-sm font-black tabular-nums"
            style={{ color: 'var(--primary-color)' }}
          >
            {totalRows} 排
          </span>
        </div>
        <button
          onClick={handleSaveAndBack}
          className="text-[10px] font-black uppercase tracking-[0.18em] px-4 py-2 rounded-lg shadow-sm"
          style={{ backgroundColor: 'var(--primary-color)', color: '#ffffff' }}
        >
          Quick Save
        </button>
      </div>*/}
    </div>
  );
}

// === 織圖圖庫 ===

function LibraryView({
  savedPatterns,
  onDeletePattern,
  onNewPattern,
  onCreateProject,
  onEditPattern,
}) {
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-fade-in pb-24">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-8 px-2">
          <div>
            <h2 className="text-4xl font-black text-theme-text tracking-tighter leading-none mb-3">
              織圖
            </h2>
            <p className="text-sm font-black opacity-30 uppercase tracking-[0.2em]">
              設計圖收藏庫
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                onNewPattern('TEXT');
              }}
              className="bg-theme-primary text-white px-5 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-theme-primary/20 transition-all hover:opacity-80"
            >
              + ADD
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
        {savedPatterns.map((ptn) => (
        <div
          key={ptn.id}
          onClick={() => onEditPattern(ptn)}
          className="group flex flex-col cursor-pointer"
        >
          {/* 封面：4:5 */}
          <div
            className="
              relative aspect-[4/5]
              rounded-[2rem] overflow-hidden
              bg-theme-accent
              shadow-sm
              transition-all duration-500
              group-hover:shadow-xl
            "
          >
            {ptn.coverImage ? (
              <img
                src={ptn.coverImage}
                alt={ptn.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            ) : (
              <DefaultCover name={ptn.name} />
            )}

            {/* 左上角：Category / Type */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              <span
                className="
                  px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                  bg-theme-bg text-theme-text backdrop-blur
                "
              >
                {ptn.category || '未分類'}
              </span>

              {/* <span
                className="
                  px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                  bg-theme-primary text-white backdrop-blur
                "
              >
                {ptn.type}
              </span> */}
            </div>

            {/* 右上角：工具鈕（hover 才出現） */}
            <div
              className="
                absolute top-4 right-4 flex gap-2
                translate-y-[-8px] opacity-0
                group-hover:translate-y-0 group-hover:opacity-100
                transition-all duration-300
              "
            >
              {/* 編輯 */}
              {/* <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPattern(ptn);
                }}
                className="
                  w-8 h-8 rounded-full
                  bg-theme-bg text-theme-primary
                  flex items-center justify-center shadow-sm
                  hover:bg-theme-primary hover:text-white
                  transition-colors
                "
              >
                <Icons.Library className="w-4 h-4" />
              </button> */}

              {/* 刪除 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!window.confirm('確定要刪除這個織圖嗎？')) return;
                  onDeletePattern(ptn.id);
                }}
                className="
                  w-8 h-8 rounded-full
                  bg-theme-bg text-theme-text/50
                  flex items-center justify-center shadow-sm
                  hover:text-red-500
                  transition-colors
                "
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 下方：標題 + 小 Play 按鈕 */}
          <div className="mt-5 px-1 flex justify-between items-center">
            <h3
              className="
                text-lg md:text-xl font-black truncate tracking-tight
                text-theme-text transition-colors
                group-hover:text-theme-primary
              "
            >
              {ptn.name}
            </h3>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateProject(ptn);
              }}
              className="group/play relative ml-4"
            >
              <div
                className="
                  w-10 h-10 rounded-full
                  bg-theme-accent text-theme-primary
                  flex items-center justify-center
                  shadow-inner
                  transition-all duration-300
                  group-hover/play:scale-110 active:scale-95
                "
              >
                <Icons.Play
                  size={16}
                  className="ml-0.5"
                  strokeWidth={0}
                  fill="currentColor"
                />
              </div>

              <span
                className="
                  absolute -top-7 left-1/2 -translate-x-1/2
                  bg-theme-text text-theme-bg
                  text-[8px] px-2 py-1 rounded
                  uppercase tracking-widest opacity-0
                  group-hover/play:opacity-100
                  transition-opacity pointer-events-none
                "
              >
                Start
              </span>
            </button>
          </div>
        </div>
        ))}

        {savedPatterns.length === 0 && (
          <div className="col-span-full text-center text-xs text-gray-400 py-10">
            目前沒有織圖，可以從右上角按鈕新增。
          </div>
        )}
      </div>


    </div>
  );
}

// === 類別工具列（篩選） ===

function CategoryToolbar({
  categories,
  categoryFilter,
  onChangeFilter,
}) {
  const active = categoryFilter || 'ALL';

  return (
    <div className="px-4 md:px-8 pt-3 pb-3 bg-white border-b border-theme-accent/20 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => onChangeFilter('ALL')}
              className={`px-3 py-1.5 mr-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] border ${
                active === 'ALL'
                  ? 'bg-theme-primary text-white border-theme-primary shadow-sm'
                  : 'bg-white text-theme-text/60 border-theme-bg'
              }`}
            >
              全部
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => onChangeFilter(c)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.18em] border whitespace-nowrap ${
                  active === c
                    ? 'bg-theme-primary text-white border-theme-primary shadow-sm'
                    : 'bg-theme-bg text-theme-text/70 border-theme-bg'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// === 類別庫頁 ===

function CategoryLibraryView({
  categories,
  savedPatterns,
  activeProjects,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onUpdateOrder, // ✅ 新增：拖曳排序完成後回傳新順序
}) {
  const [newCat, setNewCat] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [tempName, setTempName] = useState('');

  // ✅ 新增：排序模式 + 拖曳狀態
  const [isSortMode, setIsSortMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const stats = useMemo(
    () =>
      categories.map((c) => {
        const patternCount = savedPatterns.filter(
          (p) => (p.category || '未分類') === c
        ).length;
        const projectCount = activeProjects.filter(
          (p) => (p.category || '未分類') === c
        ).length;
        return { name: c, patternCount, projectCount };
      }),
    [categories, savedPatterns, activeProjects]
  );

  const isDefaultCategory = (name) => name === '未分類';

  // --- 拖曳邏輯（照樣式.txt） ---
  const handleDragStart = (e, index) => {
    if (!isSortMode) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget;
    setTimeout(() => target.classList.add('dragging'), 0); // :contentReference[oaicite:3]{index=3}
  };

  const handleDragOver = (e, index) => {
    if (!isSortMode) return;
    e.preventDefault();
    setDragOverIndex(index); // :contentReference[oaicite:4]{index=4}
  };

  const handleDrop = (e, index) => {
    if (!isSortMode || draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...categories];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    onUpdateOrder?.(newOrder); // :contentReference[oaicite:5]{index=5}
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedIndex(null);
    setDragOverIndex(null); // :contentReference[oaicite:6]{index=6}
  };

  // --- 編輯邏輯（你原本的） ---
  const handleAdd = () => {
    const name = newCat.trim();
    if (!name) return;
    onAddCategory(name);
    setNewCat('');
  };

  const startEdit = (name) => {
    setEditingName(name);
    setTempName(name);
  };

  const saveEdit = (oldName) => {
    const nn = tempName.trim();
    if (!nn || nn === oldName) {
      setEditingName(null);
      setTempName('');
      return;
    }
    onRenameCategory(oldName, nn);
    setEditingName(null);
    setTempName('');
  };

  const cancelEdit = () => {
    setEditingName(null);
    setTempName('');
  };

  const handleDelete = (name) => {
    if (
      !window.confirm(
        `確定要刪除分類「${name}」嗎？\n相關織圖與專案會移到「未分類」。`
      )
    )
      return;
    onDeleteCategory(name);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-4xl font-black text-theme-text tracking-tighter leading-none mb-3">
            類別庫
          </h2>
          <p className="text-sm text-theme-text/60">統一管理分類。</p>
        </div>

        {/* ✅ 新增：排序模式切換按鈕（照樣式檔的「調整順序/完成排序」概念） */}
        <button
          onClick={() => setIsSortMode((v) => !v)}
          className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
            isSortMode
              ? 'bg-theme-primary text-white shadow-cozy scale-[1.02]'
              : 'bg-white text-theme-text shadow-cozy border border-white hover:bg-gray-50'
          }`}
          title={isSortMode ? '完成排序' : '調整順序'}
        >
          {isSortMode ? <Icons.Check size={14} /> : <Icons.GripVertical size={14} />}
          {isSortMode ? '完成排序' : '調整順序'}
        </button>
      </div>

      {/* 新增分類：排序模式時隱藏（照樣式檔） */}
      {!isSortMode && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-cozy border border-white mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {stats.length > 0 ? (
              stats.map((c) => (
                <span
                  key={c.name}
                  className="px-3 py-1.5 rounded-full bg-theme-bg text-[11px] font-black text-theme-text/70 tracking-widest"
                >
                  {c.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">
                尚未建立任何分類，可以先從下方新增。
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="新增分類，例如：童裝、披肩、玩偶…"
              className="flex-1 bg-theme-bg/40 rounded-xl px-3 py-2 text-xs border-none focus:ring-2 ring-theme-primary/20"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-xl bg-theme-primary text-white text-[10px] font-black uppercase tracking-[0.15em]"
            >
              新增
            </button>
          </div>
        </div>
      )}

      {/* 類別列表：排序模式下改成單欄比較好拖 */}
      <div className={`grid gap-6 ${isSortMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {stats.map((c, index) => {
          const editing = editingName === c.name;
          const locked = isDefaultCategory(c.name);

          return (
            <div
              key={c.name}
              draggable={isSortMode && !editing} // :contentReference[oaicite:7]{index=7}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                bg-white p-7 rounded-[2.5rem] shadow-cozy border border-white flex flex-col gap-4 transition-all
                ${isSortMode ? 'cursor-grab active:cursor-grabbing border-dashed' : ''}
                ${dragOverIndex === index && draggedIndex !== index ? 'drag-over' : ''}
              `}
            >
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/50 mb-1">
                    Category
                  </div>

                  {editing ? (
                    <input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => saveEdit(c.name)} // 你原本這段沒有 blur，我順手補上：比較不會卡住
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.name)}
                      className="w-full bg-theme-bg/40 rounded-xl px-3 py-2 text-sm font-black border-none focus:ring-2 ring-theme-primary/20"
                      autoFocus
                    />
                  ) : (
                    <div className="text-xl font-black text-theme-text tracking-tight truncate">
                      {c.name}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* 排序模式：隱藏編輯/刪除（照樣式檔「排序模式下只管拖」） */}
                  {!isSortMode && !locked && !editing && (
                    <>
                      <button
                        onClick={() => startEdit(c.name)}
                        className="text-theme-text/40 hover:text-theme-primary px-2 py-1 text-xs font-black uppercase tracking-widest"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.name)}
                        className="text-red-300 hover:text-red-500 px-2 py-1"
                      >
                        <Icons.Trash />
                      </button>
                    </>
                  )}

                  {!isSortMode && editing && (
                    <>
                      <button
                        onClick={() => saveEdit(c.name)}
                        className="text-theme-primary px-2 py-1 text-xs font-black uppercase tracking-widest"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-400 px-2 py-1 text-xs font-black uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {!isSortMode && locked && !editing && (
                    <span className="text-[9px] text-theme-text/30 uppercase tracking-[0.18em]">
                      default
                    </span>
                  )}
                </div>

                {/* 右上 icon：排序模式改成 GripVertical */}
                <div className="w-10 h-10 rounded-2xl bg-theme-bg flex items-center justify-center text-theme-primary text-lg font-black">
                  {isSortMode ? <Icons.GripVertical /> : <Icons.Grid />}
                </div>
              </div>

              {/* 統計：排序模式下隱藏（照樣式檔） */}
              {!isSortMode && (
                <div className="flex gap-4 text-xs text-theme-text/70">
                  <div className="flex-1 bg-theme-bg/40 rounded-2xl px-4 py-3">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">
                      Patterns
                    </div>
                    <div className="text-lg font-black tabular-nums">
                      {c.patternCount}
                    </div>
                  </div>
                  <div className="flex-1 bg-theme-bg/40 rounded-2xl px-4 py-3">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">
                      Projects
                    </div>
                    <div className="text-lg font-black tabular-nums">
                      {c.projectCount}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {stats.length === 0 && (
          <div className="col-span-full text-center text-xs text-gray-400 py-10">
            還沒有分類，可以先在上方新增一兩個想用的類別。
          </div>
        )}
      </div>
    </div>
  );
}

// === App Root ===

function App() {
  const [view, setView] = useState('PROJECTS');
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [themeKey, setThemeKey] = useState('PURPLE');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [categories, setCategories] = useState([
    '圍巾',
    '毛帽',
    '毛衣',
    '襪子',
    '未分類',
  ]);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [syncOpen, setSyncOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  const shouldShowMobileTabBar =
    view !== 'EDITOR' && !(view === 'PROJECTS' && selectedProjectId);

  useEffect(() => {
    const state = loadAppState();
    setSavedPatterns(
      (state.savedPatterns || []).map((p) => normalizePattern(p))
    );
    setActiveProjects(
      (state.activeProjects || []).map((p) => normalizeProject(p))
    );
    setYarns(state.yarns || []);
    setThemeKey(state.themeKey || 'PURPLE');
    if (state.categories && Array.isArray(state.categories)) {
      setCategories(state.categories);
    }
  }, []);

  useEffect(() => {
    saveAppState({
      savedPatterns,
      activeProjects,
      yarns,
      themeKey,
      categories,
    });
    const t = THEMES[themeKey] || THEMES.PURPLE;
    const r = document.documentElement;
    r.style.setProperty('--primary-color', t.primary);
    r.style.setProperty('--bg-color', t.bg);
    r.style.setProperty('--text-color', t.text);
    r.style.setProperty('--accent-color', t.accent);
    r.style.setProperty('--secondary-color', t.bg);
    const dark = isDarkHex(t.bg);
    r.dataset.isDark = dark ? 'true' : 'false';

    // Cards / panels should NOT stay pure white in dark themes, or text can vanish.
    const surface = dark ? mixHex(t.bg, '#ffffff', 0.10) : '#ffffff';
    const surfaceStrong = dark ? mixHex(t.bg, '#ffffff', 0.16) : mixHex('#ffffff', '#000000', 0.03);
    const surfaceGlass = dark ? mixHex(t.bg, '#ffffff', 0.22) : mixHex('#ffffff', '#000000', 0.06);
    const border = dark ? mixHex(t.bg, '#ffffff', 0.22) : mixHex('#000000', '#ffffff', 0.88);
    const textMuted = dark ? mixHex(t.text, t.bg, 0.35) : mixHex(t.text, t.bg, 0.55);

    r.style.setProperty('--surface-color', surface);
    r.style.setProperty('--surface-strong-color', surfaceStrong);
    r.style.setProperty('--surface-glass-color', surfaceGlass);
    r.style.setProperty('--border-color', border);
    r.style.setProperty('--muted-text-color', textMuted);
  }, [savedPatterns, activeProjects, yarns, themeKey, categories]);

  const appStateForSync = {
    savedPatterns,
    activeProjects,
    yarns,
    themeKey,
    categories,
  };

  const applyRemoteData = (remote) => {
    if (remote.savedPatterns) {
      setSavedPatterns(remote.savedPatterns.map((p) => normalizePattern(p)));
    }
    if (remote.activeProjects) {
      setActiveProjects(remote.activeProjects.map((p) => normalizeProject(p)));
    }
    if (remote.yarns) setYarns(remote.yarns);
    if (remote.themeKey) setThemeKey(remote.themeKey);
    if (remote.categories && Array.isArray(remote.categories)) {
      setCategories(remote.categories);
    }
  };

  const handleAddCategory = (name) => {
    if (!name.trim()) return;
    if (categories.includes(name)) return;
    setCategories((prev) => [...prev, name]);
  };

  const handleRenameCategory = (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
    setSavedPatterns((prev) =>
      prev.map((p) =>
        (p.category || '未分類') === oldName
          ? { ...p, category: newName }
          : p
      )
    );
    setActiveProjects((prev) =>
      prev.map((p) =>
        (p.category || '未分類') === oldName
          ? { ...p, category: newName }
          : p
      )
    );
    setCategoryFilter((prev) => (prev === oldName ? newName : prev));
  };

  const handleDeleteCategory = (name) => {
    setCategories((prev) => prev.filter((c) => c !== name));
    setSavedPatterns((prev) =>
      prev.map((p) =>
        (p.category || '未分類') === name
          ? { ...p, category: '未分類' }
          : p
      )
    );
    setActiveProjects((prev) =>
      prev.map((p) =>
        (p.category || '未分類') === name
          ? { ...p, category: '未分類' }
          : p
      )
    );
    setCategoryFilter((prev) => (prev === name ? 'ALL' : prev));
  };

  const handleNewPattern = (type, defaultCategory) => {
    const p = createNewPattern(type, defaultCategory || '未分類');
    setCurrentPattern(p);
    setView('EDITOR');
  };

  const hasPatternInFilter =
    categoryFilter === 'ALL'
      ? savedPatterns.length > 0
      : savedPatterns.some(
          (p) => (p.category || '未分類') === categoryFilter
        );

  // 先算出：現在是不是「專案詳細頁（選了某個 project）」
  // 看你的邏輯，選了 project 才會出現那個 counter 畫面
  const isProjectDetail =
    (view === 'PROJECTS' && !!selectedProjectId) || (view === 'EDITOR'); // 如果 detail 只在沒有 currentPattern 時出現，也可以再加 && !currentPattern


  return (
    <div className="flex h-screen overflow-hidden">
      {/* Dark theme safety overrides: remap hard-coded light utility colors to theme surfaces */}
      <style>{`
        [data-is-dark="true"] .bg-white { background-color: var(--surface-color) !important; }
        [data-is-dark="true"] .bg-white\\/98 { background-color: var(--surface-glass-color) !important; }
        [data-is-dark="true"] .bg-white\\/95 { background-color: var(--surface-glass-color) !important; }
        [data-is-dark="true"] .bg-white\\/90 { background-color: var(--surface-glass-color) !important; }
        [data-is-dark="true"] .bg-white\\/80 { background-color: var(--surface-strong-color) !important; }
        [data-is-dark="true"] .bg-white\\/60 { background-color: var(--surface-strong-color) !important; }
        [data-is-dark="true"] .bg-white\\/50 { background-color: var(--surface-strong-color) !important; }
        [data-is-dark="true"] .bg-white\\/40 { background-color: var(--surface-color) !important; }
        [data-is-dark="true"] .bg-white\\/25 { background-color: var(--surface-color) !important; }
        [data-is-dark="true"] .bg-white\\/15 { background-color: var(--surface-color) !important; }

        [data-is-dark="true"] .border-gray-100 { border-color: var(--border-color) !important; }
        [data-is-dark="true"] .border-white { border-color: var(--border-color) !important; }
        [data-is-dark="true"] .border-white\\/50 { border-color: var(--border-color) !important; }

        [data-is-dark="true"] .text-gray-900,
        [data-is-dark="true"] .text-gray-800,
        [data-is-dark="true"] .text-gray-700 { color: var(--text-color) !important; }

        [data-is-dark="true"] .text-gray-600,
        [data-is-dark="true"] .text-gray-500,
        [data-is-dark="true"] .text-gray-400,
        [data-is-dark="true"] .text-gray-300,
        [data-is-dark="true"] .text-gray-200 { color: var(--muted-text-color) !important; }

        /* Symbol palette: KNIT used bg-white which breaks in dark mode */
        [data-is-dark="true"] .bg-gray-100 { background-color: var(--surface-strong-color) !important; }
        [data-is-dark="true"] .bg-gray-200 { background-color: var(--surface-glass-color) !important; }
      `}</style>
      <div className="hidden md:flex w-24 bg-white border-r border-theme-accent/20 flex-col items-center py-12 space-y-12 z-30 shadow-sm relative">
        <div className="w-14 h-14 bg-theme-primary text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-theme-primary/20 font-black text-2xl">
          C
        </div>
        <nav className="flex flex-col space-y-10 w-full items-center">
          <button
            onClick={() => setView('PROJECTS')}
            className={`p-4 rounded-[1.25rem] transition-all ${
              view === 'PROJECTS'
                ? 'bg-theme-bg text-theme-primary shadow-inner'
                : 'text-gray-200 hover:text-theme-primary'
            }`}
          >
            <Icons.Play />
          </button>
          <button
            onClick={() => setView('LIBRARY')}
            className={`p-4 rounded-[1.25rem] transition-all ${
              view === 'LIBRARY' || view === 'EDITOR'
                ? 'bg-theme-bg text-theme-primary shadow-inner'
                : 'text-gray-200 hover:text-theme-primary'
            }`}
          >
            <Icons.Library />
          </button>
          <button
            onClick={() => setView('CATEGORIES')}
            className={`p-4 rounded-[1.25rem] transition-all ${
              view === 'CATEGORIES'
                ? 'bg-theme-bg text-theme-primary shadow-inner'
                : 'text-gray-200 hover:text-theme-primary'
            }`}
          >
            <Icons.Grid />
          </button>
          <button
            onClick={() => setView('YARNS')}
            className={`p-4 rounded-[1.25rem] transition-all ${
              view === 'YARNS'
                ? 'bg-theme-bg text-theme-primary shadow-inner'
                : 'text-gray-200 hover:text-theme-primary'
            }`}
          >
            <Icons.Yarn />
          </button>
          <button
            onClick={() => setView('TUTORIAL')}
            className={`p-4 rounded-[1.25rem] transition-all ${
              view === 'TUTORIAL'
                ? 'bg-theme-bg text-theme-primary shadow-inner'
                : 'text-gray-200 hover:text-theme-primary'
            }`}
          >
            <Icons.Info />
          </button>
        </nav>

        <button
          onClick={() => setSyncOpen(true)}
          className="mt-auto mb-4 bg-theme-bg text-theme-text rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 shadow-inner"
        >
          <Icons.Cloud />
        </button>

        {/* Theme picker trigger (Desktop) */}
        <div className="pb-2 hidden md:flex flex-col items-center gap-3">
          <button
            onClick={() => setThemePickerOpen(true)}
            className="
              w-full
              flex flex-col items-center
              gap-1
              px-2 py-2
              rounded-xl
              bg-white/60
              hover:bg-white/80
              transition
              overflow-hidden
            "
            title="Theme"
          >
            {/* 當前主題色預覽 */}
            <span
              className="w-5 h-5 rounded-full shrink-0"
              style={{ background: THEMES[themeKey].primary }}
            />

            {/* 文字（直式、不會撐寬） */}
            <span className="text-[11px] font-semibold leading-none opacity-80">
              THEME
            </span>

            {/* 箭頭 */}
            <span className="text-[10px] leading-none opacity-50">▼</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="md:hidden p-5 bg-white/60 backdrop-blur sticky top-0 z-20 border-b border-theme-accent/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-theme-primary rounded-xl flex items-center justify-center text-white font-black text-[10px]">
              <KnittingIcon size={30} color="var(--accent-color)"/>
            </div>
            <span className="font-black text-theme-text tracking-tighter text-xl uppercase">
              Cozy Knit
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSyncOpen(true)}
              className="w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-theme-text text-xs"
            >
              <Icons.Cloud />
            </button>
            <button
              onClick={() => setThemePickerOpen(true)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full bg-theme-bg/60 border border-theme-accent/20 shadow-sm"
              aria-label="Theme"
            >
              <span
                className="w-5 h-5 rounded-full border border-white/70 shadow-sm"
                style={{ backgroundColor: (THEMES[themeKey] || THEMES.PURPLE).primary }}
              />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-theme-text/70">
                Theme
              </span>
              <span className="text-[10px] text-theme-text/40">▾</span>
            </button>
          </div>
        </div>

        {themePickerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setThemePickerOpen(false)}
            />
            <div className="absolute left-0 right-0 bottom-0">
              <div className="mx-auto max-w-3xl">
                <div className="bg-white/95 backdrop-blur rounded-t-[2.5rem] border-t border-theme-accent/20 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] overflow-hidden">
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full border border-white/60 shadow-sm"
                        style={{ backgroundColor: (THEMES[themeKey] || THEMES.PURPLE).primary }}
                      />
                      <div>
                        <div className="text-sm font-black text-theme-text tracking-tight">
                          主題
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-text/35">
                          Appearance
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setThemePickerOpen(false)}
                      className="w-9 h-9 rounded-full bg-theme-bg/60 border border-theme-accent/20 flex items-center justify-center text-theme-text"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto no-scrollbar">
                    <ThemePickerSection
                      themeKey={themeKey}
                      setThemeKey={(id) => {
                        setThemeKey(id);
                        setThemePickerOpen(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Theme picker popover (Desktop) */}
        {themePickerOpen && (
          <div className="fixed inset-0 z-50 hidden md:block">
            {/* click-away */}
            <div
              className="absolute inset-0"
              onClick={() => setThemePickerOpen(false)}
            />

            <div className="absolute left-24 bottom-6">
              <div className="w-[360px] bg-white/95 backdrop-blur rounded-[2rem] border border-theme-accent/20 shadow-[0_18px_60px_rgba(0,0,0,0.18)] overflow-hidden">
                <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full border border-white/60 shadow-sm"
                      style={{
                        backgroundColor:
                          (THEMES[themeKey] || THEMES.PURPLE).primary,
                      }}
                    />
                    <div>
                      <div className="text-sm font-black text-theme-text tracking-tight">
                        主題
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-text/35">
                        Appearance
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setThemePickerOpen(false)}
                    className="w-9 h-9 rounded-full bg-theme-bg/60 border border-theme-accent/20 flex items-center justify-center text-theme-text"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                  <ThemePickerMenu
                    themeKey={themeKey}
                    setThemeKey={(id) => {
                      setThemeKey(id);
                      setThemePickerOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <main
          className={
            'flex-1 pb-safe ' +
            (isProjectDetail
              ? 'overflow-hidden'                // ✅ detail 頁：不要捲動
              : 'overflow-y-auto no-scrollbar')  // 其他頁：保持原本可捲動
          }
        >
          {(view === 'PROJECTS' || view === 'LIBRARY') &&
            !currentPattern &&
            !selectedProjectId && (
              <CategoryToolbar
                categories={categories}
                categoryFilter={categoryFilter}
                onChangeFilter={setCategoryFilter}
              />
            )}

          {view === 'PROJECTS' && (
            <ProjectView
              yarns={yarns}
              savedPatterns={savedPatterns}
              activeProjects={activeProjects}
              categoryFilter={categoryFilter}
              categories={categories}
              selectedId={selectedProjectId}
              setSelectedId={setSelectedProjectId}
              onUpdateProject={(p) =>
                setActiveProjects((prev) =>
                  prev.map((x) => (x.id === p.id ? p : x))
                )
              }
              onDeleteProject={(id) =>
                setActiveProjects((prev) => prev.filter((x) => x.id !== id))
              }
            />
          )}
          {view === 'YARNS' && (
            <YarnView
              yarns={yarns}
              onSaveYarn={(y) =>
                setYarns((prev) =>
                  prev.find((x) => x.id === y.id)
                    ? prev.map((x) => (x.id === y.id ? y : x))
                    : [y, ...prev]
                )
              }
              onDeleteYarn={(id) =>
                setYarns((prev) => prev.filter((x) => x.id !== id))
              }
            />
          )}
          {view === 'LIBRARY' && (
            <LibraryView
              savedPatterns={
                categoryFilter === 'ALL'
                  ? savedPatterns
                  : savedPatterns.filter(
                      (p) => (p.category || '未分類') === categoryFilter
                    )
              }
              onDeletePattern={(id) =>
                setSavedPatterns((prev) => prev.filter((x) => x.id !== id))
              }
              onNewPattern={(t) =>
                handleNewPattern(
                  t,
                  categoryFilter === 'ALL' ? null : categoryFilter
                )
              }
              onCreateProject={(ptn) => {
                if (!window.confirm('確定要以這個織圖建立新專案嗎？')) return;
                setActiveProjects((prev) => [
                  createProjectFromPattern(ptn),
                  ...prev,
                ]);
                setView('PROJECTS');
              }}
              onEditPattern={(p) => {
                setCurrentPattern(p);
                setView('EDITOR');
              }}
            />
          )}
          {view === 'CATEGORIES' && (
            <CategoryLibraryView
              categories={categories}
              savedPatterns={savedPatterns}
              activeProjects={activeProjects}
              onAddCategory={handleAddCategory}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
              onUpdateOrder={(newOrder) => setCategories(newOrder)}
            />
          )}
          {view === 'EDITOR' && currentPattern && (
            <EditorView
              pattern={currentPattern}
              categories={categories}
              yarns={yarns}
              onUpdate={(p) =>
                setSavedPatterns((prev) =>
                  prev.find((x) => x.id === p.id)
                    ? prev.map((x) =>
                        x.id === p.id
                          ? { ...p, updatedAt: new Date().toISOString() }
                          : x
                      )
                    : [
                        { ...p, updatedAt: new Date().toISOString() },
                        ...prev,
                      ]
                )
              }
              onBack={() => {
                setView('LIBRARY');
                setCurrentPattern(null);
              }}
            />
          )}
          {view === 'TUTORIAL' && (
            <TutorialView themeKey={themeKey} setThemeKey={setThemeKey} />
          )}
        </main>

        {shouldShowMobileTabBar && (
          <div className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-theme-accent/30 flex justify-around py-6 pb-safe z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
            <button
              onClick={() => setView('PROJECTS')}
              className={`transition ${
                view === 'PROJECTS'
                  ? 'text-theme-primary scale-125'
                  : 'text-gray-300'
              }`}
            >
              <Icons.Play />
            </button>
            <button
              onClick={() => setView('LIBRARY')}
              className={`transition ${
                view === 'LIBRARY' || view === 'EDITOR'
                  ? 'text-theme-primary scale-125'
                  : 'text-gray-300'
              }`}
            >
              <Icons.Library />
            </button>
            <button
              onClick={() => setView('CATEGORIES')}
              className={`transition ${
                view === 'CATEGORIES'
                  ? 'text-theme-primary scale-125'
                  : 'text-gray-300'
              }`}
            >
              <Icons.Grid />
            </button>
            <button
              onClick={() => setView('YARNS')}
              className={`transition ${
                view === 'YARNS'
                  ? 'text-theme-primary scale-125'
                  : 'text-gray-300'
              }`}
            >
              <Icons.Yarn />
            </button>
            <button
              onClick={() => setView('TUTORIAL')}
              className={`transition ${
                view === 'TUTORIAL'
                  ? 'text-theme-primary scale-125'
                  : 'text-gray-300'
              }`}
            >
              <Icons.Info />
            </button>
          </div>
        )}
      </div>

      <GitHubSyncDialog
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        onApplyRemote={applyRemoteData}
        currentState={appStateForSync}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
