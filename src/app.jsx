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
};

// === 小工具 ===

const createNewPattern = (type = 'CHART', category = '未分類') => ({
  id: crypto.randomUUID(),
  name: '未命名織圖',
  type,
  category,
  updatedAt: new Date().toISOString(),
  meta: { 
    castOn: '',
    needle: '',
    yarnId: null,   // 新增：預設線材
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
        .fill()
        .map(() => Array(10).fill('KNIT')),
    },
  ],
  textSections: [
    {
      id: crypto.randomUUID(),
      title: '起針段',
      content: '',
      repeats: 1,
      rowsPerLoop: 1,
    },
  ],
});

// 新增：projectName & startAt
const createProjectFromPattern = (ptn) => ({
  id: crypto.randomUUID(),
  patternId: ptn.id,
  patternName: ptn.name, // 保留原圖名稱 snapshot
  projectName: ptn.name, // 使用者可以改
  category: ptn.category || '未分類',
  yarnId: ptn.meta?.yarnId ?? null,      // 實際線材（預設用織圖設定）
  needle: ptn.meta?.needle ?? '',        // 實際針號
  castOn: ptn.meta?.castOn ?? '',        // 實際起針
  totalRow: 1,
  sectionRow: 1,
  notes: '',
  startAt: new Date().toISOString(), // 專案開始時間
  lastActive: new Date().toISOString(),
});

// === GitHub Sync Dialog ===

function GitHubSyncDialog({ open, onClose, onApplyRemote, currentState }) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [path, setPath] = useState('data/knitting.json');
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
    setPath(s.path || 'data/knitting.json');
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
              <input
                className="w-full rounded-xl bg-slate-50 border-none px-3 py-2 text-sm"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="data/knitting.json"
              />
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
          Yarn Stash
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
  categories,   // ⬅ 新增這個
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [plusN, setPlusN] = useState('');
  const [showAlertOverlay, setShowAlertOverlay] = useState(false);

  const currentProject = useMemo(
    () => activeProjects.find((x) => x.id === selectedId),
    [activeProjects, selectedId]
  );

  const currentPattern = useMemo(
    () =>
      currentProject
        ? savedPatterns.find((x) => x.id === currentProject.patternId)
        : null,
    [currentProject, savedPatterns]
  );

  const projectStats = useMemo(() => {
    if (!currentPattern || currentPattern.type !== 'TEXT')
      return { targetTotal: 0, activeSection: null, sectionsSummary: [] };

    let cumulativeRows = 0;
    let activeSection = null;

    const summary = (currentPattern.textSections || []).map((s) => {
      const sectionTotal = (s.rowsPerLoop || 1) * (s.repeats || 1);
      const startRow = cumulativeRows + 1;
      cumulativeRows += sectionTotal;

      if (
        currentProject &&
        currentProject.totalRow >= startRow &&
        currentProject.totalRow <= cumulativeRows
      ) {
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
  }, [currentPattern, currentProject?.totalRow]);

  const listProjects = useMemo(() => {
    const filtered =
      categoryFilter && categoryFilter !== 'ALL'
        ? activeProjects.filter(
            (p) => (p.category || '未分類') === categoryFilter
          )
        : activeProjects;

    return filtered.map((p) => {
      const pat = savedPatterns.find((x) => x.id === p.patternId);
      let targetTotal = null;
      if (pat && pat.type === 'TEXT' && Array.isArray(pat.textSections)) {
        targetTotal = pat.textSections.reduce(
          (sum, s) => sum + (s.rowsPerLoop || 1) * (s.repeats || 1),
          0
        );
      }
      return { project: p, pattern: pat, targetTotal };
    });
  }, [activeProjects, savedPatterns, categoryFilter]);

  const currentAlerts = useMemo(() => {
    if (!currentProject || !currentPattern) return [];
    const total = currentProject.totalRow;

    return (currentPattern.alerts || []).filter((a) => {
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
        val = a.type === 'SECTION' ? currentProject.sectionRow : total;
      }

      if (a.mode === 'EVERY') {
        return val > 0 && val % a.value === 0;
      }
      return val === a.value;
    });
  }, [currentProject, currentPattern, projectStats]);

  useEffect(() => {
    if (currentAlerts.length > 0) {
      setShowAlertOverlay(true);
    }
  }, [currentAlerts.length]);

  const sectionLoopInfo = useMemo(() => {
    if (!currentProject || !currentPattern) return null;

    // TEXT：用目前 activeSection 的 rowsPerLoop 來算循環內第幾排
    if (
      currentPattern.type === 'TEXT' &&
      projectStats.activeSection &&
      projectStats.activeSection.rowsPerLoop
    ) {
      const sec = projectStats.activeSection;
      const rowsPerLoop = sec.rowsPerLoop || 1;
      const offsetFromStart = currentProject.totalRow - sec.startRow; // 0-based
      if (offsetFromStart < 0) return null;

      const loopRow = (offsetFromStart % rowsPerLoop) + 1; // 循環內第幾排
      const loopIndex = Math.floor(offsetFromStart / rowsPerLoop) + 1; // 第幾輪

      return {
        mode: 'TEXT',
        title: sec.title,
        loopRow,
        loopIndex,
        rowsPerLoop,
      };
    }

    // CHART：用 sectionRow + 小節總排數來算
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
  }, [currentProject, currentPattern, projectStats]);

  const primaryAlert = currentAlerts[0];

  const update = (d) => {
    if (!currentProject) return;
    onUpdateProject({
      ...currentProject,
      totalRow: Math.max(1, currentProject.totalRow + d),
      sectionRow: Math.max(1, currentProject.sectionRow + d),
      lastActive: new Date().toISOString(),
    });
  };

  const findYarnLabel = (id) => {
    const y = yarns.find((yy) => yy.id === id);
    if (!y) return null;
    const main = [y.brand, y.name].filter(Boolean).join(' ');
    return main || '未命名線材';
  };
  // === 列表畫面：專案卡片帶進度條、開始時間 ===
  if (!selectedId) {
    return (
      <div className="max-w-5xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
        <h2 className="text-3xl font-black text-theme-text mb-6 tracking-tight">
          Active Projects
        </h2>
        <div className="grid gap-4">
          {listProjects.map(({ project: p, pattern: pat, targetTotal }) => {
            const ratio =
              targetTotal && targetTotal > 0
                ? Math.min(1, p.totalRow / targetTotal)
                : null;
            const title = p.projectName || p.patternName;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="bg-white px-6 py-5 rounded-[2.25rem] shadow-cozy border border-white flex items-center gap-6 active:scale-[0.98] transition cursor-pointer overflow-hidden relative"
              >
                <div className="w-12 h-12 bg-theme-bg rounded-2xl flex items-center justify-center text-theme-primary text-xl font-black shadow-inner flex-shrink-0">
                  R
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-3 mb-1">
                    <div className="min-w-0">
                      <h3 className="font-bold text-theme-text text-base leading-tight truncate">
                        {title}
                      </h3>
                      <div className="text-[9px] font-black text-theme-primary opacity-60 uppercase tracking-widest">
                        {p.category || '未分類'}
                        {pat?.type === 'TEXT' ? ' · TEXT' : ' · CHART'}
                      </div>
                      {p.startAt && (
                        <div className="text-[9px] text-theme-text/40 uppercase tracking-widest mt-0.5">
                          開始 {new Date(p.startAt).toLocaleDateString()}
                        </div>
                      )}
                      {(p.needle || p.castOn || p.yarnId) && (
                        <div className="text-[9px] text-theme-text/45 mt-0.5 line-clamp-2">
                          {p.yarnId && (
                            <>
                              線材：{findYarnLabel(p.yarnId)}
                              {(p.needle || p.castOn) && ' · '}
                            </>
                          )}
                          {p.needle && <>針號 {p.needle}</>}
                          {p.needle && p.castOn && ' · '}
                          {p.castOn && <>起針 {p.castOn}</>}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-black text-theme-text/60 uppercase tracking-[0.15em] mb-0.5">
                        Rows
                      </div>
                      <div className="text-lg font-black text-theme-primary tabular-nums">
                        {p.totalRow}
                        {targetTotal ? (
                          <>
                            <span className="opacity-30 mx-1">/</span>
                            <span className="opacity-80">{targetTotal}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {targetTotal && (
                    <div className="mt-2">
                      <div className="w-full h-2.5 bg-theme-bg rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-theme-primary/80 transition-all duration-500"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-theme-text/50">
                        <span>
                          進度約{' '}
                          <span className="font-black">
                            {Math.round(ratio * 100)}%
                          </span>
                        </span>
                        <span>
                          {p.totalRow} / {targetTotal} rows
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(p.id);
                  }}
                  className="text-gray-200 hover:text-red-400 px-2 transition-colors self-start"
                >
                  <Icons.Trash />
                </button>
              </div>
            );
          })}
          {listProjects.length === 0 && (
            <div className="text-center py-24 opacity-30 font-black tracking-widest uppercase text-xs">
              此分類目前沒有進行中的專案
            </div>
          )}
        </div>
      </div>
    );
  }

  // === 單一專案播放畫面 ===

  if (!currentProject || !currentPattern) return null;

  const projectTitle = currentProject.projectName || currentProject.patternName;

  return (
    <div className="flex flex-col h-full bg-theme-bg animate-fade-in pb-20 overflow-hidden relative">
      {showAlertOverlay && primaryAlert && (
        <div className="absolute inset-x-0 top-20 z-40 px-4 md:px-0">
          <div className="max-w-xl mx-auto bg-theme-primary text-white rounded-[2.25rem] shadow-2xl border border-white/30 px-6 py-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center text-2xl">
              🔔
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70 mb-1">
                Row Alert ·{' '}
                {primaryAlert.type === 'SECTION' ? 'Section' : 'Total'} ·{' '}
                {primaryAlert.mode === 'EVERY' ? 'Every' : 'At'}{' '}
                {primaryAlert.value}
              </div>
              <div className="text-sm font-bold leading-snug">
                {primaryAlert.message || '下一段變化來了～'}
              </div>
            </div>
            <button
              onClick={() => setShowAlertOverlay(false)}
              className="text-xs font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 transition flex-shrink-0"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur p-4 border-b flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <button
          onClick={() => setSelectedId(null)}
          className="text-gray-400 font-bold px-2 uppercase text-[10px] tracking-widest"
        >
          ← Back
        </button>
        <h2 className="font-black text-theme-text truncate text-sm tracking-tight px-4">
          {projectTitle}
        </h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 no-scrollbar pb-40">
        {/* 專案名稱編輯＋開始時間 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-cozy border border-white flex flex-col gap-2">
          <div className="flex justify-between items-end gap-3">
            <div className="flex-1">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/50 mb-1">
                Project Name
              </div>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) =>
                  onUpdateProject({
                    ...currentProject,
                    projectName: e.target.value,
                  })
                }
                className="w-full bg-transparent border-none text-lg md:text-xl font-black tracking-tight p-0 focus:ring-0"
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
           <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-theme-text/50">
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
          {/* 新增：線材 + 針號 + 起針數 編輯列 */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-theme-text/70">
            <div className="flex items-center gap-1">
              <span className="font-black uppercase tracking-[0.2em]">Yarn</span>
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
                className="bg-theme-bg/60 rounded-full px-3 py-1 border-none text-[10px] w-20"
                placeholder="4.0mm"
                value={currentProject.needle || ''}
                onChange={(e) =>
                  onUpdateProject({ ...currentProject, needle: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="uppercase tracking-[0.2em] font-black opacity-60">
                Cast on
              </span>
              <input
                className="bg-theme-bg/60 rounded-full px-3 py-1 border-none text-[10px] w-20"
                placeholder="例如 112"
                value={currentProject.castOn || ''}
                onChange={(e) =>
                  onUpdateProject({ ...currentProject, castOn: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {currentPattern.type === 'TEXT' && projectStats.targetTotal > 0 && (
          <div className="bg-white p-6 rounded-[2rem] shadow-cozy border border-white space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[9px] font-black uppercase opacity-40 tracking-widest block mb-1">
                  目前階段 Currently
                </span>
                <span className="font-black text-theme-text text-base tracking-tight">
                  {projectStats.activeSection?.title || 'Unknown'}
                </span>
              </div>
              <span className="font-black text-theme-primary tabular-nums text-lg">
                {currentProject.totalRow}
                <span className="opacity-20 mx-1">/</span>
                {projectStats.targetTotal}
                <span className="text-[9px] opacity-40 uppercase ml-1">
                  Rows
                </span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-theme-bg rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-theme-primary transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    (currentProject.totalRow / projectStats.targetTotal) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
          {/* 左側：Counter + Section + 專案備註 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[3rem] p-8 flex flex-col items-center shadow-cozy border-2 border-white">
              <h3 className="text-theme-primary font-black uppercase tracking-widest text-[9px] mb-3 opacity-50">
                Row Counter
              </h3>
              <div className="text-7xl md:text-8xl font-black text-theme-text tabular-nums leading-none mb-8 tracking-tighter drop-shadow-md">
                {currentProject.totalRow}
              </div>

              <div className="w-full space-y-6">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => {
                      update(-1);
                      setShowAlertOverlay(false);
                    }}
                    className="py-5 bg-theme-bg rounded-[2rem] text-theme-primary shadow-inner font-black text-3xl active:scale-95 transition"
                  >
                    −
                  </button>
                  <button
                    onClick={() => {
                      update(1);
                      setShowAlertOverlay(false);
                    }}
                    className="py-6 bg-theme-primary text-white rounded-[2.25rem] shadow-xl shadow-theme-primary/20 font-black text-4xl active:scale-95 transition"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-stretch gap-2 bg-theme-bg/60 p-2 rounded-[1.75rem] shadow-inner w-full">
                  <input
                    type="number"
                    value={plusN}
                    onChange={(e) => setPlusN(e.target.value)}
                    placeholder="+n"
                    className="flex-1 min-w-0 bg-transparent border-none text-center font-black text-xl focus:ring-0 tabular-nums placeholder:opacity-20"
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
                    className="bg-theme-text text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] tracking-widest transition-all active:scale-95 shadow-lg uppercase"
                  >
                    Go
                  </button>
                </div>
              </div>
              {sectionLoopInfo && (
                <div className="w-full mt-2 flex justify-between items-center text-[10px] text-theme-text/55">
                  <span className="font-black uppercase tracking-[0.2em]">
                    Section Loop
                  </span>
                  <span className="tabular-nums text-right">
                    {sectionLoopInfo.title && (
                      <span className="mr-1 text-[9px] text-theme-text/40">
                        {sectionLoopInfo.title} ·
                      </span>
                    )}
                    第{' '}
                    <span className="font-black text-theme-text/80">
                      {sectionLoopInfo.loopRow}
                    </span>{' '}
                    排（循環共 {sectionLoopInfo.rowsPerLoop} 排，第{' '}
                    {sectionLoopInfo.loopIndex} 輪）
                  </span>
                </div>
              )}
            </div>

            {/* <div className="bg-white p-6 rounded-[2rem] shadow-cozy border border-white flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-theme-text opacity-50 mb-1">
                  Section Loop
                </h3>
                <div className="text-4xl font-black text-theme-text tabular-nums tracking-tighter">
                  {currentProject.sectionRow}
                </div>
              </div>
              <button
                onClick={() =>
                  onUpdateProject({ ...currentProject, sectionRow: 1 })
                }
                className="text-[9px] font-black text-theme-primary border-2 border-theme-primary/10 px-5 py-2.5 rounded-full hover:bg-theme-bg transition uppercase tracking-widest flex-shrink-0 ml-4"
              >
                Reset
              </button>
            </div> */}

            <div className="bg-white p-6 rounded-[2rem] shadow-cozy border border-white space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text/60 mb-1">
                    Project Notes
                  </div>
                  <div className="text-xs text-theme-text/60">
                    織到一半的狀況、試穿感想、改版紀錄…
                  </div>
                </div>
              </div>
              <textarea
                className="w-full mt-2 bg-theme-bg/40 rounded-2xl p-3.5 text-sm leading-relaxed border-none focus:ring-2 ring-theme-primary/20 min-h-[100px] resize-none"
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

          {/* 右側：說明/織圖預覽 + pattern 備註 */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-cozy border border-white min-h-[380px]">
              <h4 className="font-black text-theme-text border-b border-theme-bg pb-5 mb-8 flex items-center gap-3 tracking-widest uppercase text-[10px]">
                <Icons.Library /> Instruction
              </h4>
              {currentPattern.type === 'TEXT' ? (
                <div className="space-y-10">
                  {currentPattern.textSections?.map((sec) => {
                    const isActive =
                      projectStats.activeSection?.id === sec.id;
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
                          className={`font-mono text-base leading-relaxed whitespace-pre-wrap ${
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
                                className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono select-none ${
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

            {currentPattern.notes && (
              <div className="bg-theme-bg/40 p-5 rounded-[2rem] border border-theme-bg/60">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">
                  Pattern Notes
                </div>
                <div className="text-sm text-theme-text whitespace-pre-wrap leading-relaxed">
                  {currentPattern.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// === 織圖編輯器（含 pattern 備註） ===

function EditorView({ pattern, onUpdate, onBack, categories, yarns }) {
  const [data, setData] = useState({
     ...pattern ,
    meta: {
      castOn: '',
      needle: '',
      yarnId: null,
      ...(pattern.meta || {}),
    },
  });
  const [activeTab, setActiveTab] = useState('CONTENT');
  const [selectedTool, setSelectedTool] = useState('KNIT');

  useEffect(() => {
    onUpdate(data);
  }, [data]);

  const totalRows = useMemo(() => {
    if (data.type !== 'TEXT') return 0;
    return (data.textSections || []).reduce(
      (sum, s) => sum + (s.rowsPerLoop || 1) * (s.repeats || 1),
      0
    );
  }, [data.textSections]);

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
          onClick={onBack}
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
                      <span className="font-mono font-black text-lg">
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
                              className={`w-8 h-8 flex items-center justify-center text-xs font-mono font-black cursor-pointer hover:opacity-50 transition-all ${
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
                    onClick={() =>
                      setData({
                        ...data,
                        textSections: [
                          ...(data.textSections || []),
                          {
                            id: crypto.randomUUID(),
                            title: '新段落',
                            content: '',
                            repeats: 1,
                            rowsPerLoop: 1,
                          },
                        ],
                      })
                    }
                    className="bg-theme-primary text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 shadow-theme-primary/20"
                  >
                    <Icons.Plus />
                  </button>
                </div>
                {(data.textSections || []).map((sec) => (
                  <div
                    key={sec.id}
                    className="bg-white rounded-[3rem] border-2 border-theme-bg shadow-soft overflow-hidden group animate-fade-in"
                  >
                    <div className="bg-theme-bg/40 p-8 space-y-6 border-b border-theme-bg">
                      <div className="flex justify-between items-center">
                        <input
                          value={sec.title}
                          onChange={(e) => {
                            const ns = data.textSections.map((s) =>
                              s.id === sec.id
                                ? { ...s, title: e.target.value }
                                : s
                            );
                            setData({ ...data, textSections: ns });
                          }}
                          className="bg-transparent font-black text-base uppercase focus:ring-0 border-none w-1/2 p-0 tracking-widest"
                          placeholder="段落標題"
                        />
                        <button
                          onClick={() => {
                            setData({
                              ...data,
                              textSections: data.textSections.filter(
                                (s) => s.id !== sec.id
                              ),
                            });
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
                              const ns = data.textSections.map((s) =>
                                s.id === sec.id
                                  ? {
                                      ...s,
                                      rowsPerLoop: parseInt(e.target.value) || 1,
                                    }
                                  : s
                              );
                              setData({ ...data, textSections: ns });
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
                              const ns = data.textSections.map((s) =>
                                s.id === sec.id
                                  ? {
                                      ...s,
                                      repeats: parseInt(e.target.value) || 1,
                                    }
                                  : s
                              );
                              setData({ ...data, textSections: ns });
                            }}
                            className="w-full text-2xl font-black border-none p-0 focus:ring-0 tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={sec.content}
                      onChange={(e) => {
                        const ns = data.textSections.map((s) =>
                          s.id === sec.id
                            ? { ...s, content: e.target.value }
                            : s
                        );
                        setData({ ...data, textSections: ns });
                      }}
                      className="w-full h-48 p-10 text-lg font-mono focus:ring-0 border-none resize-none leading-relaxed text-theme-text bg-white"
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
                  onClick={() =>
                    setData({
                      ...data,
                      alerts: [
                        ...(data.alerts || []),
                        {
                          id: crypto.randomUUID(),
                          value: 1,
                          mode: 'SPECIFIC',
                          type: 'TOTAL',
                          sectionId: 'ALL',
                          message: '',
                        },
                      ],
                    })
                  }
                  className="bg-theme-primary text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-theme-primary/20 tracking-[0.1em] transition-all hover:scale-105"
                >
                  + Add New Rule
                </button>
              </div>
              <div className="grid gap-6">
                {(data.alerts || []).map((a) => (
                  <div
                    key={a.id}
                    className="bg-white p-10 rounded-[3rem] shadow-cozy border-2 border-theme-bg flex flex-col gap-6 animate-fade-in group hover:border-theme-primary/20 transition-all"
                  >
                    <div className="flex flex-wrap gap-6 items-center">
                      <select
                        value={a.mode}
                        onChange={(e) => {
                          const na = data.alerts.map((rule) =>
                            rule.id === a.id
                              ? { ...rule, mode: e.target.value }
                              : rule
                          );
                          setData({ ...data, alerts: na });
                        }}
                        className="text-[10px] font-black bg-theme-bg p-3.5 rounded-xl border-none uppercase tracking-widest"
                      >
                        <option value="SPECIFIC">第幾排提醒 (Once)</option>
                        <option value="EVERY">每幾排提醒 (Interval)</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={a.value}
                          onChange={(e) => {
                            const na = data.alerts.map((rule) =>
                              rule.id === a.id
                                ? {
                                    ...rule,
                                    value: parseInt(e.target.value) || 1,
                                  }
                                : rule
                            );
                            setData({ ...data, alerts: na });
                          }}
                          className="w-24 text-center font-black text-lg p-3.5 rounded-xl bg-theme-bg border-none tabular-nums focus:ring-2 ring-theme-primary/20"
                        />
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                          排
                        </span>
                      </div>

                      {data.type === 'TEXT' && (
                        <select
                          value={a.sectionId || 'ALL'}
                          onChange={(e) => {
                            const na = data.alerts.map((rule) =>
                              rule.id === a.id
                                ? { ...rule, sectionId: e.target.value }
                                : rule
                            );
                            setData({ ...data, alerts: na });
                          }}
                          className="text-[10px] font-black bg-theme-primary/10 text-theme-primary p-3.5 rounded-xl border-none uppercase tracking-widest ml-auto min-w-[140px]"
                        >
                          <option value="ALL">適用所有區段</option>
                          {(data.textSections || []).map((sec) => (
                            <option key={sec.id} value={sec.id}>
                              限：{sec.title}
                            </option>
                          ))}
                        </select>
                      )}

                      <select
                        value={a.type}
                        onChange={(e) => {
                          const na = data.alerts.map((rule) =>
                            rule.id === a.id
                              ? { ...rule, type: e.target.value }
                              : rule
                          );
                          setData({ ...data, alerts: na });
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
                          setData({
                            ...data,
                            alerts: data.alerts.filter(
                              (rule) => rule.id !== a.id
                            ),
                          });
                        }}
                        className="text-red-400 p-2 opacity-20 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      value={a.message}
                      onChange={(e) => {
                        const na = data.alerts.map((rule) =>
                          rule.id === a.id
                            ? { ...rule, message: e.target.value }
                            : rule
                        );
                        setData({ ...data, alerts: na });
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-8 px-2">
        <div>
          <h2 className="text-4xl font-black text-theme-text tracking-tighter leading-none mb-3">
            Collections
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {savedPatterns.map((ptn) => (
          <div
            key={ptn.id}
            className="bg-white p-10 rounded-[3rem] shadow-cozy border border-white flex flex-col active:scale-[0.98] transition relative overflow-hidden group"
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

// === 類別工具列（篩選＋快速新增） ===

function CategoryToolbar({
  categories,
  categoryFilter,
  onChangeFilter,
  onAddCategory,
  onQuickNewPattern,
  onQuickNewProject,
  hasPatternInFilter,
}) {
  const [newCat, setNewCat] = useState('');

  const handleAdd = () => {
    const name = newCat.trim();
    if (!name) return;
    onAddCategory(name);
    onChangeFilter(name);
    setNewCat('');
  };

  const active = categoryFilter || 'ALL';

  return (
    <div className="px-4 md:px-8 pt-3 pb-3 bg-white/90 border-b border-theme-accent/20 sticky top-0 z-15 backdrop-blur">
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
                    ? 'bg-theme-primary/90 text-white border-theme-primary shadow-sm'
                    : 'bg-theme-bg text-theme-text/70 border-theme-bg'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="快速新增分類…"
            className="flex-1 bg-theme-bg/40 rounded-full px-3 py-1.5 text-[11px] border-none focus:ring-2 ring-theme-primary/20"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 rounded-full bg-theme-bg text-theme-text/60 text-[10px] font-black uppercase tracking-[0.15em]"
          >
            新增分類
          </button>
        </div>
      </div>
    </div>
  );
}

// === 類別庫頁（可改名＆刪除） ===

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
    if (!window.confirm(`確定要刪除分類「${name}」嗎？\n相關織圖與專案會移到「未分類」。`))
      return;
    onDeleteCategory(name);
  };

  const isDefaultCategory = (name) => name === '未分類';

  return (
    <div className="max-w-5xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-4xl font-black text-theme-text tracking-tighter leading-none mb-3">
            Category Library
          </h2>
          <p className="text-sm text-theme-text/60">
            統一管理「圍巾 / 毛帽 / 毛衣 / 襪子 / 未分類…」等分類。
          </p>
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
  const [view, setView] = useState('PROJECTS'); // PROJECTS / LIBRARY / CATEGORIES / YARNS / EDITOR / TUTORIAL
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [themeKey, setThemeKey] = useState('PURPLE');

  const [categories, setCategories] = useState([
    '圖巾',
    '毛帽',
    '毛衣',
    '襪子',
    '未分類',
  ]);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [syncOpen, setSyncOpen] = useState(false);

  useEffect(() => {
    const state = loadAppState();
    setSavedPatterns(state.savedPatterns || []);
    setActiveProjects(state.activeProjects || []);
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
    if (remote.savedPatterns) setSavedPatterns(remote.savedPatterns);
    if (remote.activeProjects) setActiveProjects(remote.activeProjects);
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

  // 類別改名：同步更新 pattern / project 上的 category
  const handleRenameCategory = (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    setCategories((prev) =>
      prev.map((c) => (c === oldName ? newName : c))
    );
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

  // 類別刪除：相關東西移到「未分類」
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
      : savedPatterns.some((p) => (p.category || '未分類') === categoryFilter);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
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
        {/* Mobile Header */}
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
          {(view === 'PROJECTS' || view === 'LIBRARY') && (
            <CategoryToolbar
              categories={categories}
              categoryFilter={categoryFilter}
              onChangeFilter={setCategoryFilter}
              onAddCategory={handleAddCategory}
              onQuickNewPattern={(type) =>
                handleNewPattern(
                  type,
                  categoryFilter === 'ALL' ? null : categoryFilter
                )
              }
              onQuickNewProject={() => {
                let basePattern = null;
                if (categoryFilter === 'ALL') {
                  basePattern = savedPatterns[0] || null;
                } else {
                  basePattern =
                    savedPatterns.find(
                      (p) => (p.category || '未分類') === categoryFilter
                    ) || null;
                }
                if (!basePattern) return;
                setActiveProjects((prev) => [
                  createProjectFromPattern(basePattern),
                  ...prev,
                ]);
                setView('PROJECTS');
              }}
              hasPatternInFilter={hasPatternInFilter}
            />
          )}

          {view === 'PROJECTS' && (
            <ProjectView
              yarns={yarns}
              savedPatterns={savedPatterns}
              activeProjects={activeProjects}
              categoryFilter={categoryFilter}
              categories={categories}   // ⬅ 新增這行
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
              yarns={yarns}        // 新增
              onUpdate={(p) =>
                setSavedPatterns((prev) =>
                  prev.find((x) => x.id === p.id)
                    ? prev.map((x) =>
                        x.id === p.id
                          ? { ...p, updatedAt: new Date().toISOString() }
                          : x
                      )
                    : [{ ...p, updatedAt: new Date().toISOString() }, ...prev]
                )
              }
              onBack={() => setView('LIBRARY')}
            />
          )}
          {view === 'TUTORIAL' && <TutorialView />}
        </main>

        {/* Mobile Bottom Nav */}
        {view !== 'EDITOR' && (
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
