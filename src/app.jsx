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

const { useState, useEffect, useMemo } = React;

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

const THEMES = {
  PURPLE: {
    id: 'PURPLE',
    primary: '#8e8499',
    bg: '#f4f2f7',
    text: '#5d5666',
    accent: '#dcd3e3',
  },
  BLUE: {
    id: 'BLUE',
    primary: '#7da1c4',
    bg: '#f0f5f9',
    text: '#4e6173',
    accent: '#cfe0eb',
  },
  PINK: {
    id: 'PINK',
    primary: '#c48e8e',
    bg: '#faf3f3',
    text: '#735252',
    accent: '#ebcfcf',
  },
  DARK: {
    id: 'DARK',
    primary: '#1a1a1a',
    bg: '#ffffff',
    text: '#1a1a1a',
    accent: '#eeeeee',
  },
};

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
};

// === 小工具 ===

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

function TutorialView() {
  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
      <h2 className="text-4xl font-black text-theme-text mb-12 tracking-tighter">
        編織指南與符號
      </h2>
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
                🧶
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
        if (!a.startFrom || a.startFrom < 1) {
          return val > 0 && val % a.value === 0;
        }
        if (val < a.startFrom) return false;
        return (val - a.startFrom) % a.value === 0;
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

  const sectionLoopInfo = useMemo(() => {
    if (!currentProject || !currentPattern) return null;

    if (
      currentPattern.type === 'TEXT' &&
      projectStats.activeSection &&
      projectStats.activeSection.rowsPerLoop
    ) {
      const sec = projectStats.activeSection;
      const rowsPerLoop = sec.rowsPerLoop || 1;
      const offsetFromStart = currentTotalRow - sec.startRow;
      if (offsetFromStart < 0) return null;

      const loopRow = (offsetFromStart % rowsPerLoop) + 1;
      const loopIndex = Math.floor(offsetFromStart / rowsPerLoop) + 1;

      return {
        mode: 'TEXT',
        title: sec.title,
        loopRow,
        loopIndex,
        rowsPerLoop,
      };
    }

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

  if (!selectedId) {
    return (
      <div className="max-w-6xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
        <h2 className="text-3xl font-black text-theme-text mb-6 tracking-tight">
          進行中專案
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {listProjects.map(
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
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              pat?.type === 'CHART'
                                ? 'border-purple-200 text-purple-500'
                                : 'border-blue-200 text-blue-500'
                            }`}
                          >
                            {pat?.type || 'TEXT'}
                          </span>
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
                        🧶
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
                      <div className="bg-[#F8F9FA] rounded-2xl p-2.5 space-y-2 border border-gray-50">
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
                          <span className="text-xl font-black italic opacity-90">
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

          {listProjects.length === 0 && (
            <div className="col-span-full text-center py-24 opacity-30 font-black tracking-widest uppercase text-xs">
              此分類目前沒有進行中的專案
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
      <div className="min-h-screen flex flex-col bg-theme-bg relative overflow-hidden">
        {/* 上方標題列 */}
        <div className="flex-none bg-white/80 backdrop-blur p-4 border-b flex items-center justify-between z-30 shadow-sm">
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

              {/* 手機隱藏文字，sm 以上才顯示 */}
              <span className="hidden sm:inline">
                織圖
              </span>
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

        {/* 中間可捲動內容 */}
        {/* 中間主要內容：只保留部位切換 + 底部 Panel 區域 */}
        <div className="flex-1 px-4 py-4 md:px-10 flex flex-col overflow-hidden">
          {/* 部位切換按鈕列 */}
          {currentProject.partsProgress && currentProject.partsProgress.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
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
                      'px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition ' +
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
          )}

          {/* 🆕 提醒區：固定高度，覆蓋於中間，不撐開主要版面 */}
          <div className="relative h-4 mb-1">
            {showAlertOverlay && currentAlerts.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="max-w-xl w-full px-1 sm:px-0">
                  <div className="bg-theme-primary text-white rounded-[1.5rem] shadow-2xl border border-white/30 px-3 py-2 flex items-start gap-2 pointer-events-auto">
                    <div className="w-7 h-7 bg-white/15 rounded-2xl flex items-center justify-center text-base flex-shrink-0">
                      🔔
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] opacity-70 mb-0.5 truncate">
                        Row Alert · {currentAlerts.length} rule
                        {currentAlerts.length > 1 ? 's' : ''} on this row
                      </div>

                      {/* 內容：如果太多就截斷，不增加版面高度 */}
                      <div className="mt-0.5 space-y-1 max-h-9 overflow-hidden">
                        {currentAlerts.map((alert, idx) => (
                          <div
                            key={alert.id || idx}
                            className="flex items-start gap-1 text-[11px] leading-snug"
                          >
                            <span className="mt-[1px] text-[10px]">•</span>
                            <div className="min-w-0">
                              <div className="text-[9px] opacity-80 uppercase tracking-[0.12em] mb-0.5 truncate">
                                {alert.type === 'SECTION' ? 'Section' : 'Total'} ·{' '}
                                {alert.mode === 'EVERY' ? 'Every' : 'At'}{' '}
                                {alert.value}
                              </div>
                              <div className="text-[11px] font-bold truncate">
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

          {/* 讓下面 Panel 靠近畫面底部 */}
          <div className="flex-none mt-1">
            {/* 底部 Panel 等一下放進來（第 3 段） */}
                {/* 底部常駐：Section Loop + Currently + Counter */}
                {currentPartProgress && (
                    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                      {/* 浮動當前指令：固定在計數器上方（這段你原本的可以保留） */}
                      {activeInstructionText && (
                        <div
                          className="animate-float-subtle mb-3 bg-white/95 backdrop-blur rounded-[2rem] shadow-lg border border-theme-bg/60 px-5 py-4 cursor-pointer"
                          onClick={() => setShowFullInstruction(!showFullInstruction)}
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
                                className={
                                  'text-xs md:text-sm text-theme-text/90 whitespace-pre-wrap leading-relaxed ' +
                                  (showFullInstruction ? 'max-h-64 overflow-y-auto' : 'max-h-12 overflow-hidden')
                                }
                              >
                                {activeInstructionText}
                              </div>
                              {!showFullInstruction && (
                                <div className="mt-1 text-[10px] text-theme-text/40">
                                  點擊展開完整指令…
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ✅ 這一層是新的外框：負責白底 + pointer-events-auto + 進度條 */}
                      <div className="bg-white/98 backdrop-blur rounded-[2.5rem] border border-theme-accent/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden">
                        {/* 頂部進度條 */}
                        <div className="h-1.5 w-full bg-theme-bg overflow-hidden">
                          <div
                            className="h-full bg-theme-primary transition-all duration-700 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* 內層內容：Section Loop / Currently / Row Counter */}
                        <div className="p-4 md:px-8">
                          {/* 手機：上下（左區在上、Row Counter 在下）
                              桌機：左右（左區在左、Row Counter 在右） */}
                          <div className="flex flex-col md:flex-row items-stretch gap-4">
                            {/* 左半：Section Loop + Currently */}
                            <div className="flex-1 border-b md:border-b-0 md:border-r border-theme-bg/60 pb-3 md:pb-0 md:pr-4">
                              {/* 手機：Section Loop 左、Currently 右
                                  桌機：Section Loop 在上、Currently 在下 */}
                              <div className="flex flex-row md:flex-col items-start justify-between gap-4">
                                {/* Section Loop */}
                                <div className="text-theme-text/70">
                                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/40 mb-1">
                                    Section Loop
                                  </div>
                                  {sectionLoopInfo ? (
                                    <div className="border-l-2 border-theme-primary/20 pl-2">
                                      {sectionLoopInfo.title && (
                                        <div className="text-xs font-bold text-theme-text truncate max-w-[120px] md:max-w-none">
                                          {sectionLoopInfo.title}
                                        </div>
                                      )}
                                      <div className="text-[11px] md:text-xs text-theme-text/60 tabular-nums">
                                        第{' '}
                                        <span className="font-semibold text-theme-text/90">
                                          {sectionLoopInfo.loopRow}
                                        </span>{' '}
                                        / {sectionLoopInfo.rowsPerLoop} 排
                                        <span className="mx-1 text-theme-text/30">|</span>
                                        第{' '}
                                        <span className="font-semibold text-theme-text/90">
                                          {sectionLoopInfo.loopIndex}
                                        </span>{' '}
                                        輪
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] opacity-50">
                                      尚未有 Section Loop 資訊
                                    </div>
                                  )}
                                </div>

                                {/* Currently：手機跟桌機都顯示 */}
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

                            {/* 右半：Row Counter + +n Go */}
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
                        </div>{/* /p-4 */}
                      </div>{/* /pointer-events-auto + bg-white */}
                    </div>
                )}
          </div>
        </div>


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
          title="織圖說明"
          onClose={() => setActiveModal(null)}
          icon={Icons.Library}
        >
          <div className="space-y-4">
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

            {/* Instruction 內容（沿用你原本的邏輯） */}
            <div className="bg-white p-6 rounded-[2rem] shadow-cozy border border-white min-h-[260px]">
              <h4 className="font-black text-theme-text border-b border-theme-bg pb-3 mb-4 flex items-center gap-3 tracking-widest uppercase text-[10px]">
                <Icons.Library /> Instruction
              </h4>
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
          title="Project Notes"
          onClose={() => setActiveModal(null)}
          icon={Icons.StickyNote}
        >
          <div className="space-y-2">
            <div className="text-xs text-theme-text/60">
              織到一半的狀況、試穿感想、改版紀錄…
            </div>
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

  useEffect(() => {
    if (!data.parts || !data.parts.length) return;
    if (!activePartId || !data.parts.some((p) => p.id === activePartId)) {
      setActivePartId(data.parts[0].id);
    }
  }, [data.parts, activePartId]);

  const currentPart = useMemo(() => {
    if (!data.parts || !data.parts.length) return null;
    if (!activePartId) return data.parts[0];
    return data.parts.find((p) => p.id === activePartId) || data.parts[0];
  }, [data.parts, activePartId]);

  const sectionsSource = useMemo(() => {
    if (data.type !== 'TEXT') return [];
    if (
      currentPart &&
      Array.isArray(currentPart.textSections) &&
      currentPart.textSections.length > 0
    ) {
      return currentPart.textSections;
    }
    return data.textSections || [];
  }, [data.type, currentPart, data.textSections]);

  const alertsSource = useMemo(() => {
    if (
      currentPart &&
      Array.isArray(currentPart.alerts) &&
      currentPart.alerts.length > 0
    ) {
      return currentPart.alerts;
    }
    return data.alerts || [];
  }, [currentPart, data.alerts]);

  const updateActivePart = (updater) => {
    if (!currentPart) return;
    setData((prev) => ({
      ...prev,
      parts: (prev.parts || []).map((p) =>
        p.id === currentPart.id ? updater(p) : p
      ),
    }));
  };
  
    const handleDeletePart = (partId) => {
      // 先防呆：如果只剩一個部位，就不給刪
      if (!data.parts || data.parts.length <= 1) return;

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
        // 如果刪掉的是現在選的那個部位，就把 active 改成剩下陣列的第一個
        if (!newParts.some((p) => p.id === nextActiveId)) {
          nextActiveId = newParts[0]?.id ?? null;
        }

        return {
          ...prev,
          parts: newParts,
        };
      });
    };

  useEffect(() => {
    onUpdate(data);
  }, [data]);

  const totalRows = useMemo(() => {
    if (data.type !== 'TEXT') return 0;
    return sectionsSource.reduce(
      (sum, s) => sum + (s.rowsPerLoop || 1) * (s.repeats || 1),
      0
    );
  }, [data.type, sectionsSource]);

  const categoryOptions = useMemo(() => {
    const base =
      Array.isArray(categories) && categories.length
        ? categories
        : ['未分類'];
    const current = data.category || '未分類';
    return base.includes(current) ? base : [current, ...base];
  }, [categories, data.category]);

  const resizeGrid = (sid, field, value) => {
    const n = Math.max(1, Math.min(60, parseInt(value) || 1));
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sid) return s;
        const rs = field === 'rows' ? n : s.rows;
        const cs = field === 'cols' ? n : s.cols;
        const grid = Array(rs)
          .fill()
          .map((_, r) =>
            Array(cs)
              .fill()
              .map((_, c) => (s.grid[r] && s.grid[r][c]) || 'KNIT')
          );
        return { ...s, rows: rs, cols: cs, grid };
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

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in pb-safe overflow-hidden">
      <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <button
          onClick={onBack}
          className="text-gray-400 font-bold px-2 text-xs uppercase tracking-widest"
        >
          Cancel
        </button>
        <div className="flex bg-theme-bg p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveTab('CONTENT')}
            className={`px-6 py-2 text-[10px] font-black rounded-xl transition ${
              activeTab === 'CONTENT'
                ? 'bg-white shadow text-theme-text'
                : 'opacity-30'
            }`}
          >
            編輯內容
          </button>
          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-6 py-2 text-[10px] font-black rounded-xl transition ${
              activeTab === 'ALERTS'
                ? 'bg-white shadow text-theme-text'
                : 'opacity-30'
            }`}
          >
            提醒規則
          </button>
        </div>
        <button
          onClick={() => {
            onUpdate(data);
            onBack();
          }}
          className="text-theme-primary font-black px-2 text-xs uppercase tracking-widest"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="p-10 bg-theme-bg/30 flex justify-between items-end gap-4 flex-wrap">
          <div className="flex-1 mr-0 md:mr-6 min-w-[220px]">
            <label className="text-[10px] font-black opacity-30 uppercase tracking-widest block mb-2 pl-1">
              Pattern Design
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full text-3xl md:text-4xl font-black bg-transparent border-none p-0 focus:ring-0 tracking-tighter"
              placeholder="設計標題..."
            />
            <div className="mt-3 flex gap-2 items-center">
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                分類
              </span>
              <select
                className="flex-1 bg-white/70 rounded-xl border-none px-3 py-1.5 text-[11px] font-bold text-theme-text focus:ring-2 ring-theme-primary/20"
                value={data.category || '未分類'}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, category: e.target.value }))
                }
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {data.type === 'TEXT' && (
            <div className="text-right pb-1 min-w-[140px]">
              <div className="text-[10px] font-black opacity-30 uppercase">
                總排數計算
              </div>
              <div className="text-2xl font-black text-theme-primary tabular-nums tracking-tighter">
                {totalRows} 排
              </div>
            </div>
          )}
        </div>

        {/* 部位設定 Parts */}
        <div className="p-6 md:p-10 space-y-8">
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">
                  Parts / 部位
                </div>
                <div className="text-[11px] text-theme-text/60">
                  例如：前片、後片、左袖、右袖…
                </div>
              </div>
              <button
                onClick={() => {
                  const parts = data.parts && data.parts.length ? data.parts : [];
                  const defaultName = `部位 ${parts.length + 1}`;

                  const input = window.prompt('請輸入新的部位名稱：', defaultName);
                  const name = (input ?? '').trim() || defaultName;

                  const newPart = {
                    id: crypto.randomUUID(),
                    name,
                    textSections: data.textSections || [],
                    alerts: data.alerts || [],
                  };

                  setData((prev) => ({
                    ...prev,
                    parts: [...(prev.parts || []), newPart],
                  }));
                  setActivePartId(newPart.id); // 新增後直接切到新部位
                }}
                className="text-[10px] px-3 py-1 rounded-full bg-theme-primary text-white font-black tracking-[0.16em] uppercase"
              >
                + Add Part
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(data.parts || []).map((part) => {
                const isActive = currentPart && part.id === currentPart.id;
                const totalParts = (data.parts || []).length;

                return (
                  <div
                    key={part.id}
                    className="flex items-center gap-1"
                  >
                    <button
                      onClick={() => setActivePartId(part.id)}
                      className={
                        'px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition ' +
                        (isActive
                          ? 'bg-theme-primary text-white shadow'
                          : 'bg-theme-bg text-theme-text/60 hover:bg-theme-bg/80')
                      }
                    >
                      {part.name}
                    </button>

                    {/* 至少要保留 1 個部位，只有在部位數 > 1 時才顯示刪除 */}
                    {totalParts > 1 && (
                      <button
                        onClick={() => handleDeletePart(part.id)}
                        className="text-[11px] text-red-300 hover:text-red-500 px-1 py-0.5 rounded-full transition"
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
              <span className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em]">
                部位名稱
              </span>
              <input
                className="flex-1 bg-theme-bg/40 rounded-full px-3 py-1.5 text-[11px] border-none focus:ring-2 ring-theme-primary/20"
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
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-12">
          {activeTab === 'CONTENT' && (
            <div className="bg-white rounded-[2.5rem] p-6 md:p-7 shadow-cozy border border-theme-bg/60 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] block mb-1">
                    Pattern Notes
                  </div>
                  <div className="text-xs text-theme-text/70">
                    其他尺寸加減針、注意事項、改版記錄…
                  </div>
                </div>
              </div>
              <textarea
                className="w-full mt-2 bg-theme-bg/30 rounded-2xl p-4 text-sm leading-relaxed border-none focus:ring-2 ring-theme-primary/20 min-h-[100px] resize-none"
                placeholder="例：M 號在第 18 排多加 2 針、袖子在麻花段前多編 6 排。"
                value={data.notes || ''}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          )}

          {activeTab === 'CONTENT' ? (
            data.type === 'CHART' ? (
              <div className="space-y-12">
                <div className="flex gap-2 overflow-x-auto pb-4 sticky top-0 bg-white/90 backdrop-blur z-10 no-scrollbar py-4">
                  {Object.values(SYMBOLS).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTool(t.id)}
                      className={`flex-shrink-0 w-12 h-12 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                        selectedTool === t.id
                          ? 'border-theme-primary bg-theme-primary text-white scale-110 shadow-lg shadow-theme-primary/20'
                          : 'border-theme-bg opacity-40'
                      }`}
                    >
                      <span className="font-zen-mono font-black text-lg">
                        {t.symbol}
                      </span>
                      <span className="text-[7px] font-black uppercase mt-0.5">
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
                {(data.sections || []).map((s) => (
                  <div
                    key={s.id}
                    className="bg-theme-bg/20 p-10 rounded-[3rem] border-2 border-white shadow-soft"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <input
                        value={s.name}
                        onChange={(e) =>
                          setData({
                            ...data,
                            sections: data.sections.map((sec) =>
                              sec.id === s.id
                                ? { ...sec, name: e.target.value }
                                : sec
                            ),
                          })
                        }
                        className="bg-transparent font-black text-xl focus:ring-0 border-none p-0 w-1/2 tracking-tighter"
                        placeholder="區段名稱"
                      />
                      <div className="flex gap-2 bg-white/50 p-2.5 rounded-xl border border-white">
                        <input
                          type="number"
                          value={s.cols}
                          onChange={(e) =>
                            resizeGrid(s.id, 'cols', e.target.value)
                          }
                          className="w-12 text-center font-black text-xs bg-transparent"
                        />
                        <span className="opacity-20 font-black">×</span>
                        <input
                          type="number"
                          value={s.rows}
                          onChange={(e) =>
                            resizeGrid(s.id, 'rows', e.target.value)
                          }
                          className="w-12 text-center font-black text-xs bg-transparent"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                      <div
                        className="grid gap-[1px] bg-theme-accent border-4 border-theme-accent inline-block rounded-xl overflow-hidden shadow-2xl"
                        style={{ gridTemplateColumns: `repeat(${s.cols}, 32px)` }}
                      >
                        {s.grid.map((row, r) =>
                          row.map((cell, c) => (
                            <div
                              key={`${r}-${c}`}
                              onClick={() => toggleCell(s.id, r, c)}
                              className={`w-8 h-8 flex items-center justify-center text-xs font-zen-mono font-black cursor-pointer hover:opacity-50 transition-all ${
                                SYMBOLS[cell].color
                              }`}
                            >
                              {SYMBOLS[cell].symbol}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center px-4">
                  <h3 className="font-black text-theme-text uppercase text-xs tracking-widest opacity-50">
                    文字段落 Sections
                  </h3>
                  <button
                    onClick={() => {
                      if (!currentPart) return;
                      const base = sectionsSource;
                      const nextSections = [
                        ...base,
                        {
                          id: crypto.randomUUID(),
                          title: '新段落',
                          content: '',
                          repeats: 1,
                          rowsPerLoop: 1,
                        },
                      ];
                      updateActivePart((part) => ({
                        ...part,
                        textSections: nextSections,
                      }));
                    }}
                    className="bg-theme-primary text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 shadow-theme-primary/20"
                  >
                    <Icons.Plus />
                  </button>
                </div>
                {sectionsSource.map((sec) => (
                  <div
                    key={sec.id}
                    className="bg-white rounded-[3rem] border-2 border-theme-bg shadow-soft overflow-hidden group animate-fade-in"
                  >
                    <div className="bg-theme-bg/40 p-8 space-y-6 border-b border-theme-bg">
                      <div className="flex justify-between items-center">
                        <input
                          value={sec.title}
                          onChange={(e) => {
                            if (!currentPart) return;
                            const value = e.target.value;
                            updateActivePart((part) => ({
                              ...part,
                              textSections: (part.textSections || []).map(
                                (s) =>
                                  s.id === sec.id
                                    ? { ...s, title: value }
                                    : s
                              ),
                            }));
                          }}
                          className="bg-transparent font-black text-base uppercase focus:ring-0 border-none w-1/2 p-0 tracking-widest"
                          placeholder="段落標題"
                        />
                        <button
                          onClick={() => {
                            if (!currentPart) return;
                            updateActivePart((part) => ({
                              ...part,
                              textSections: (part.textSections || []).filter(
                                (s) => s.id !== sec.id
                              ),
                            }));
                          }}
                          className="text-red-400 opacity-20 group-hover:opacity-100 transition-opacity p-2"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white rounded-[1.25rem] p-5 shadow-sm space-y-1">
                          <label className="text-[9px] font-black opacity-30 uppercase block mb-1">
                            循環排數 Rows/Loop
                          </label>
                          <input
                            type="number"
                            value={sec.rowsPerLoop}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 1;
                              updateActivePart((part) => ({
                                ...part,
                                textSections: (part.textSections || []).map(
                                  (s) =>
                                    s.id === sec.id
                                      ? { ...s, rowsPerLoop: v }
                                      : s
                                ),
                              }));
                            }}
                            className="w-full text-2xl font-black border-none p-0 focus:ring-0 tabular-nums"
                          />
                        </div>
                        <div className="bg-white rounded-[1.25rem] p-5 shadow-sm space-y-1">
                          <label className="text-[9px] font-black opacity-30 uppercase block mb-1">
                            重複次數 Repeats
                          </label>
                          <input
                            type="number"
                            value={sec.repeats}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 1;
                              updateActivePart((part) => ({
                                ...part,
                                textSections: (part.textSections || []).map(
                                  (s) =>
                                    s.id === sec.id
                                      ? { ...s, repeats: v }
                                      : s
                                ),
                              }));
                            }}
                            className="w-full text-2xl font-black border-none p-0 focus:ring-0 tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={sec.content}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateActivePart((part) => ({
                          ...part,
                          textSections: (part.textSections || []).map((s) =>
                            s.id === sec.id
                              ? { ...s, content: value }
                              : s
                          ),
                        }));
                      }}
                      className="w-full h-48 p-10 text-lg font-zen-mono focus:ring-0 border-none resize-none leading-relaxed text-theme-text bg-white"
                      placeholder="輸入此階段編織說明..."
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center px-4">
                <h3 className="font-black text-theme-text text-xl tracking-tighter uppercase tracking-widest opacity-60">
                  Smart Notifications
                </h3>
                <button
                  onClick={() => {
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
                        message: '',
                      },
                    ];
                    updateActivePart((part) => ({
                      ...part,
                      alerts: nextAlerts,
                    }));
                  }}
                  className="bg-theme-primary text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-theme-primary/20 tracking-[0.1em] transition-all hover:scale-105"
                >
                  + Add New Rule
                </button>
              </div>
              <div className="grid gap-6">
                {alertsSource.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white p-10 rounded-[3rem] shadow-cozy border-2 border-theme-bg flex flex-col gap-6 animate-fade-in group hover:border-theme-primary/20 transition-all"
                  >
                    <div className="flex flex-wrap gap-6 items-center">
                      <select
                        value={a.mode}
                        onChange={(e) => {
                          const mode = e.target.value;
                          updateActivePart((part) => ({
                            ...part,
                            alerts: (part.alerts || []).map((rule) =>
                              rule.id === a.id ? { ...rule, mode } : rule
                            ),
                          }));
                        }}
                        className="text-[10px] font-black bg-theme-bg p-3.5 rounded-xl border-none uppercase tracking-widest"
                      >
                        <option value="SPECIFIC">第幾排提醒 (Once)</option>
                        <option value="EVERY">每幾排提醒 (Interval)</option>
                      </select>

                      <div className="flex items-center gap-2">
                        {a.mode === 'EVERY' && (
                          <>
                            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">
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
                                updateActivePart((part) => ({
                                  ...part,
                                  alerts: (part.alerts || []).map((rule) =>
                                    rule.id === a.id
                                      ? { ...rule, startFrom: v }
                                      : rule
                                  ),
                                }));
                              }}
                              className="w-20 text-center font-black bg-theme-bg border-none tabular-nums focus:ring-2 ring-theme-primary/20"
                            />
                            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                              排開始，
                            </span>
                          </>
                        )}

                        <input
                          type="number"
                          value={a.value}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 1;
                            updateActivePart((part) => ({
                              ...part,
                              alerts: (part.alerts || []).map((rule) =>
                                rule.id === a.id
                                  ? { ...rule, value: v }
                                  : rule
                              ),
                            }));
                          }}
                          className="w-24 text-center font-black bg-theme-bg border-none tabular-nums focus:ring-2 ring-theme-primary/20"
                        />
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                          {a.mode === 'EVERY' ? '排為間隔' : '排'}
                        </span>
                      </div>

                      {data.type === 'TEXT' && (
                        <select
                          value={a.sectionId || 'ALL'}
                          onChange={(e) => {
                            const sectionId = e.target.value;
                            updateActivePart((part) => ({
                              ...part,
                              alerts: (part.alerts || []).map((rule) =>
                                rule.id === a.id
                                  ? { ...rule, sectionId }
                                  : rule
                              ),
                            }));
                          }}
                          className="text-[10px] font-black bg-theme-primary/10 text-theme-primary p-3.5 rounded-xl border-none uppercase tracking-widest ml-auto min-w-[140px]"
                        >
                          <option value="ALL">適用所有區段</option>
                          {sectionsSource.map((sec) => (
                            <option key={sec.id} value={sec.id}>
                              限：{sec.title}
                            </option>
                          ))}
                        </select>
                      )}

                      <select
                        value={a.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          updateActivePart((part) => ({
                            ...part,
                            alerts: (part.alerts || []).map((rule) =>
                              rule.id === a.id ? { ...rule, type } : rule
                            ),
                          }));
                        }}
                        className={`text-[10px] font-black bg-theme-bg p-3.5 rounded-xl border-none uppercase tracking-widest ${
                          data.type !== 'TEXT' ? 'ml-auto' : ''
                        }`}
                      >
                        <option value="TOTAL">累計總排數</option>
                        <option value="SECTION">區段/花樣段</option>
                      </select>
                      <button
                        onClick={() => {
                          updateActivePart((part) => ({
                            ...part,
                            alerts: (part.alerts || []).filter(
                              (rule) => rule.id !== a.id
                            ),
                          }));
                        }}
                        className="text-red-400 p-2 opacity-20 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      value={a.message}
                      onChange={(e) => {
                        const msg = e.target.value;
                        updateActivePart((part) => ({
                          ...part,
                          alerts: (part.alerts || []).map((rule) =>
                            rule.id === a.id ? { ...rule, message: msg } : rule
                          ),
                        }));
                      }}
                      className="w-full text-lg font-bold bg-theme-bg/30 p-6 rounded-[2rem] border-none focus:ring-2 ring-theme-primary/20 text-theme-text"
                      placeholder="提醒內容 (例如: 該扭麻花了!、該加一針了...)"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
                onNewPattern('CHART');
              }}
              className="bg-theme-primary/10 text-theme-primary px-7 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-theme-primary/10 transition-all hover:bg-theme-primary hover:text-white shadow-sm"
            >
              + CHART
            </button>
            <button
              onClick={() => {
                onNewPattern('TEXT');
              }}
              className="bg-theme-primary text-white px-7 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-theme-primary/20 transition-all hover:opacity-80"
            >
              + TEXT
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
        {savedPatterns.map((ptn) => (
          <div
            key={ptn.id}
            className="bg-white p-5 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] shadow-cozy border ... group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-theme-bg rounded-bl-full -mr-12 -mt-12 opacity-60 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div
                className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner ${
                  ptn.type === 'CHART'
                    ? 'bg-rose-50 text-rose-300'
                    : 'bg-amber-50 text-amber-500'
                }`}
              >
                {ptn.type === 'CHART' ? '▦' : '≡'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPattern(ptn);
                  }}
                  className="text-theme-primary p-3 hover:bg-theme-bg rounded-2xl transition-all shadow-sm"
                >
                  <Icons.Library />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      !window.confirm('確定要刪除這個織圖嗎？\n此動作無法復原。')
                    )
                      return;
                    onDeletePattern(ptn.id);
                  }}
                  className="text-gray-200 hover:text-red-400 p-3 transition-colors"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
            <h3 className="font-black text-theme-text text-2xl mb-2 relative z-10 tracking-tighter leading-tight">
              {ptn.name}
            </h3>
            <div className="text-[10px] font-black text-theme-primary opacity-60 uppercase tracking-widest mb-10 relative z-10">
              {ptn.category || '未分類'} ·{' '}
              {new Date(ptn.updatedAt).toLocaleDateString()}
            </div>
            <button
              onClick={() => onCreateProject(ptn)}
              className="w-full py-6 bg-theme-primary text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:shadow-2xl hover:shadow-theme-primary/30 transition-all mt-auto"
            >
              Start Knitting
            </button>
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
}) {
  const [newCat, setNewCat] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [tempName, setTempName] = useState('');

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

  const isDefaultCategory = (name) => name === '未分類';

  return (
    <div className="max-w-5xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-4xl font-black text-theme-text tracking-tighter leading-none mb-3">
            類別庫
          </h2>
          <p className="text-sm text-theme-text/60">統一管理分類。</p>
        </div>
      </div>

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
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-xl bg-theme-primary text-white text-[10px] font-black uppercase tracking-[0.15em]"
          >
            新增
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((c) => {
          const editing = editingName === c.name;
          const locked = isDefaultCategory(c.name);
          return (
            <div
              key={c.name}
              className="bg-white p-7 rounded-[2.5rem] shadow-cozy border border-white flex flex-col gap-4"
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
                  {!locked && !editing && (
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
                  {editing && (
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
                  {locked && !editing && (
                    <span className="text-[9px] text-theme-text/30 uppercase tracking-[0.18em]">
                      default
                    </span>
                  )}
                </div>
                <div className="w-10 h-10 rounded-2xl bg-theme-bg flex items-center justify-center text-theme-primary text-lg font-black">
                  <Icons.Grid />
                </div>
              </div>
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


  return (
    <div className="flex h-screen overflow-hidden">
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

        <div className="flex flex-col gap-5 pb-2">
          {Object.values(THEMES).map((t) => (
            <div
              key={t.id}
              onClick={() => setThemeKey(t.id)}
              className="theme-dot transition-all"
              style={{
                backgroundColor: t.primary,
                opacity: themeKey === t.id ? 1 : 0.3,
                transform: themeKey === t.id ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="md:hidden p-5 bg-white/60 backdrop-blur sticky top-0 z-20 border-b border-theme-accent/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-theme-primary rounded-xl flex items-center justify-center text-white font-black text-[10px]">
              C
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
            <div className="flex gap-1.5">
              {Object.values(THEMES).map((t) => (
                <div
                  key={t.id}
                  onClick={() => setThemeKey(t.id)}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{
                    backgroundColor: t.primary,
                    opacity: themeKey === t.id ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-safe">
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
          {view === 'TUTORIAL' && <TutorialView />}
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
