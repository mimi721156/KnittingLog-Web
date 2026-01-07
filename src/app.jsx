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

// --- 1. 定義輔助組件與邏輯 ---

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
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
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

const createNewPattern = (type = 'CHART') => ({
  id: crypto.randomUUID(),
  name: '未命名織圖',
  type,
  category: '未分類',
  updatedAt: new Date().toISOString(),
  meta: { castOn: '', needle: '' },
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

// --- GitHub Sync 對話框 ---

function GitHubSyncDialog({
  open,
  onClose,
  onApplyRemote,
  currentState,
}) {
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
            <div className="font-black text-theme-text">
              GitHub 雲端同步設定
            </div>
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

// --- 子元件: 教學 ---
function TutorialView() {
  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
      <h2 className="text-4xl font-black text-theme-text mb-12 tracking-tighter">
        編織指南與符號
      </h2>
      <div className="bg-white p-10 rounded-[3rem] shadow-cozy border border-white">
        <h3 className="font-black text-theme-primary text-xl mb-10 border-b border-theme-bg pb-5 tracking-widest uppercase">
          JIS Symbols 基礎符號
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

// --- 子元件: 線材庫 ---
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
                系列 Name
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-theme-text tracking-tighter">
          My Yarn Stash
        </h2>
        <button
          onClick={() =>
            setEditing({ id: crypto.randomUUID(), brand: '', name: '' })
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
                <p className="text-[10px] font-black text-theme-primary uppercase tracking-widest">
                  {y.brand}
                </p>
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

// --- 子組件: 專案播放器 (含區段提醒邏輯) ---
// function ProjectView({
//   activeProjects,
//   savedPatterns,
//   yarns,
//   onUpdateProject,
//   onDeleteProject,
// }) {
//   const [selectedId, setSelectedId] = useState(null);
//   const [plusN, setPlusN] = useState('');

//   const currentProject = useMemo(
//     () => activeProjects.find((x) => x.id === selectedId),
//     [activeProjects, selectedId]
//   );
//   const currentPattern = useMemo(
//     () =>
//       currentProject
//         ? savedPatterns.find((x) => x.id === currentProject.patternId)
//         : null,
//     [currentProject, savedPatterns]
//   );

//   const projectStats = useMemo(() => {
//     if (!currentPattern || currentPattern.type !== 'TEXT')
//       return { targetTotal: 0, activeSection: null };

//     let cumulativeRows = 0;
//     let activeSection = null;
//     const summary = (currentPattern.textSections || []).map((s) => {
//       const sectionTotal = (s.rowsPerLoop || 1) * (s.repeats || 1);
//       const startRow = cumulativeRows + 1;
//       cumulativeRows += sectionTotal;

//       if (
//         currentProject &&
//         currentProject.totalRow >= startRow &&
//         currentProject.totalRow <= cumulativeRows
//       ) {
//         activeSection = { ...s, startRow, endRow: cumulativeRows };
//       }

//       return { ...s, totalRows: sectionTotal, startRow, endRow: cumulativeRows };
//     });

//     return { targetTotal: cumulativeRows, sectionsSummary: summary, activeSection };
//   }, [currentPattern, currentProject?.totalRow]);

//   if (!selectedId) {
//     return (
//       <div className="max-w-5xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
//         <h2 className="text-3xl font-black text-theme-text mb-10 tracking-tight">
//           Active Projects
//         </h2>
//         <div className="grid gap-4">
//           {activeProjects.map((p) => (
//             <div
//               key={p.id}
//               onClick={() => setSelectedId(p.id)}
//               className="bg-white p-6 rounded-[2.5rem] shadow-cozy border border-white flex justify-between items-center active:scale-[0.98] transition cursor-pointer"
//             >
//               <div className="flex items-center gap-5">
//                 <div className="w-14 h-14 bg-theme-bg rounded-2xl flex items-center justify-center text-theme-primary text-2xl font-black shadow-inner">
//                   R
//                 </div>
//                 <h3 className="font-bold text-theme-text text-xl leading-tight">
//                   {p.patternName}
//                 </h3>
//               </div>
//               <div className="flex items-center gap-8">
//                 <div className="text-5xl font-black text-theme-primary tabular-nums tracking-tighter">
//                   {p.totalRow}
//                 </div>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     onDeleteProject(p.id);
//                   }}
//                   className="text-gray-200 hover:text-red-400 px-2 transition-colors"
//                 >
//                   <Icons.Trash />
//                 </button>
//               </div>
//             </div>
//           ))}
//           {activeProjects.length === 0 && (
//             <div className="text-center py-24 opacity-30 font-black tracking-widest uppercase">
//               No Active Projects
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   if (!currentProject || !currentPattern) return null;

//   const update = (d) =>
//     onUpdateProject({
//       ...currentProject,
//       totalRow: Math.max(1, currentProject.totalRow + d),
//       sectionRow: Math.max(1, currentProject.sectionRow + d),
//     });

//   const currentAlerts =
//     currentPattern.alerts?.filter((a) => {
//       if (
//         a.sectionId &&
//         a.sectionId !== 'ALL' &&
//         projectStats.activeSection?.id !== a.sectionId
//       ) {
//         return false;
//       }
//       const val =
//         a.type === 'SECTION' ? currentProject.sectionRow : currentProject.totalRow;
//       return a.mode === 'EVERY'
//         ? val > 0 && val % a.value === 0
//         : val === a.value;
//     }) || [];

//   return (
//     <div className="flex flex-col h-full bg-theme-bg animate-fade-in pb-20 overflow-hidden">
//       <div className="bg-white/80 backdrop-blur p-4 border-b flex justify-between items-center sticky top-0 z-30 shadow-sm">
//         <button
//           onClick={() => setSelectedId(null)}
//           className="text-gray-400 font-bold px-2 uppercase text-[10px] tracking-widest"
//         >
//           ← Back
//         </button>
//         <h2 className="font-black text-theme-text truncate text-sm tracking-tight px-4">
//           {currentProject.patternName}
//         </h2>
//         <div className="w-10"></div>
//       </div>

//       <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-10 no-scrollbar pb-40">
//         {currentPattern.type === 'TEXT' && projectStats.targetTotal > 0 && (
//           <div className="bg-white p-8 rounded-[2.5rem] shadow-cozy border border-white space-y-4">
//             <div className="flex justify-between items-end">
//               <div>
//                 <span className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-1">
//                   Currently Knitting 目前階段
//                 </span>
//                 <span className="font-black text-theme-text text-xl tracking-tight">
//                   {projectStats.activeSection?.title || 'Unknown'}
//                 </span>
//               </div>
//               <span className="font-black text-theme-primary tabular-nums text-2xl">
//                 {currentProject.totalRow}{' '}
//                 <span className="opacity-20 mx-1">/</span>{' '}
//                 {projectStats.targetTotal}{' '}
//                 <span className="text-[10px] opacity-40 uppercase">Rows</span>
//               </span>
//             </div>
//             <div className="w-full h-3 bg-theme-bg rounded-full overflow-hidden shadow-inner">
//               <div
//                 className="h-full bg-theme-primary transition-all duration-700"
//                 style={{
//                   width: `${Math.min(
//                     100,
//                     (currentProject.totalRow / projectStats.targetTotal) * 100
//                   )}%`,
//                 }}
//               ></div>
//             </div>
//           </div>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
//           <div className="lg:col-span-5 space-y-8">
//             <div className="bg-white rounded-[4rem] p-12 flex flex-col items-center shadow-cozy border-2 border-white">
//               <h3 className="text-theme-primary font-black uppercase tracking-widest text-[10px] mb-4 opacity-50">
//                 Row Counter
//               </h3>
//               <div className="text-9xl md:text-[11rem] font-black text-theme-text tabular-nums leading-none mb-12 tracking-tighter drop-shadow-md">
//                 {currentProject.totalRow}
//               </div>

//               <div className="w-full space-y-8">
//                 <div className="grid grid-cols-2 gap-6 w-full">
//                   <button
//                     onClick={() => update(-1)}
//                     className="py-8 bg-theme-bg rounded-[2.5rem] text-theme-primary shadow-inner font-black text-4xl active:scale-95 transition"
//                   >
//                     −
//                   </button>
//                   <button
//                     onClick={() => update(1)}
//                     className="py-8 bg-theme-primary text-white rounded-[2.5rem] shadow-xl shadow-theme-primary/20 font-black text-5xl active:scale-95 transition"
//                   >
//                     +
//                   </button>
//                 </div>

//                 <div className="flex items-stretch gap-2 bg-theme-bg/50 p-2.5 rounded-[2rem] shadow-inner w-full">
//                   <input
//                     type="number"
//                     value={plusN}
//                     onChange={(e) => setPlusN(e.target.value)}
//                     placeholder="+n"
//                     className="flex-1 min-w-0 bg-transparent border-none text-center font-black text-2xl focus:ring-0 tabular-nums placeholder:opacity-20"
//                   />
//                   <button
//                     onClick={() => {
//                       const n = parseInt(plusN);
//                       if (!isNaN(n)) update(n);
//                       setPlusN('');
//                     }}
//                     className="bg-theme-text text-white px-10 py-5 rounded-[1.5rem] font-black text-xs tracking-widest transition-all active:scale-95 shadow-lg uppercase"
//                   >
//                     Go
//                   </button>
//                 </div>
//               </div>
//             </div>
//             <div className="bg-white p-8 rounded-[2rem] shadow-cozy border border-white flex justify-between items-center">
//               <div className="min-w-0 flex-1">
//                 <h3 className="text-theme-primary font-black uppercase tracking-widest text-[10px] mb-1 opacity-40">
//                   Section Loop
//                 </h3>
//                 <div className="text-6xl font-black text-theme-text tabular-nums tracking-tighter">
//                   {currentProject.sectionRow}
//                 </div>
//               </div>
//               <button
//                 onClick={() =>
//                   onUpdateProject({ ...currentProject, sectionRow: 1 })
//                 }
//                 className="text-[10px] font-black text-theme-primary border-2 border-theme-primary/10 px-6 py-3 rounded-full hover:bg-theme-bg transition uppercase tracking-widest flex-shrink-0 ml-4"
//               >
//                 Reset
//               </button>
//             </div>
//           </div>

//           <div className="lg:col-span-7 space-y-6">
//             {currentAlerts.map((a) => (
//               <div
//                 key={a.id}
//                 className="bg-theme-primary p-8 rounded-[3rem] text-whiteproduk shadow-xl animate-fade-in relative overflow-hidden group border border-white/20"
//               >
//                 <div className="absolute -right-5 -bottom-5 w-32 h-32 bg-white/10 rounded-full"></div>
//                 <div className="relative z-10 flex items-start gap-6">
//                   <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-4xl animate-bounce">
//                     🔔
//                   </div>
//                   <div className="flex-1">
//                     <div className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest">
//                       {a.mode === 'EVERY' ? 'Every' : 'At'} {a.value} Rows ·{' '}
//                       {a.type === 'SECTION' ? 'Section' : 'Global'}
//                     </div>
//                     <div className="text-2xl font-black leading-tight tracking-tight">
//                       {a.message}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}

//             <div className="bg-white p-10 rounded-[3.5rem] shadow-cozy border border-white min-h-[450px]">
//               <h4 className="font-black text-theme-text border-b border-theme-bg pb-6 mb-10 flex items-center gap-3 tracking-widest uppercase text-xs">
//                 <Icons.Library /> Instruction Manual
//               </h4>
//               {currentPattern.type === 'TEXT' ? (
//                 <div className="space-y-12">
//                   {currentPattern.textSections?.map((sec) => {
//                     const isActive =
//                       projectStats.activeSection?.id === sec.id;
//                     return (
//                       <div
//                         key={sec.id}
//                         className={`relative pl-8 border-l-4 transition-all group ${
//                           isActive
//                             ? 'border-theme-primary scale-[1.02]'
//                             : 'border-theme-bg opacity-40 grayscale'
//                         }`}
//                       >
//                         <div className="flex flex-wrap items-center gap-3 mb-4">
//                           <span
//                             className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
//                               isActive
//                                 ? 'bg-theme-primary text-white shadow-md'
//                                 : 'bg-theme-bg'
//                             }`}
//                           >
//                             {sec.title}
//                           </span>
//                           <span className="text-[9px] font-bold opacity-30 uppercase tracking-tighter">
//                             {sec.rowsPerLoop} rows × {sec.repeats} times
//                           </span>
//                         </div>
//                         <div
//                           className={`font-mono text-lg leading-relaxed whitespace-pre-wrap ${
//                             isActive
//                               ? 'text-theme-text font-bold'
//                               : 'text-gray-400'
//                           }`}
//                         >
//                           {sec.content}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <div className="flex flex-col items-center">
//                   {currentPattern.sections?.[0] && (
//                     <div className="inline-block bg-white border-4 border-theme-bg rounded-2xl p-2 shadow-inner overflow-x-auto max-w-full">
//                       <div
//                         className="grid gap-[1px] bg-theme-accent/30"
//                         style={{
//                           gridTemplateColumns: `repeat(${currentPattern.sections[0].cols}, 24px)`,
//                         }}
//                       >
//                         {currentPattern.sections[0].grid.map((row, r) =>
//                           row.map((cell, c) => {
//                             const localIdx =
//                               (currentProject.sectionRow - 1) %
//                               currentPattern.sections[0].rows;
//                             const isHighlight =
//                               r ===
//                               currentPattern.sections[0].rows - 1 - localIdx;
//                             return (
//                               <div
//                                 key={`${r}-${c}`}
//                                 className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono select-none ${
//                                   SYMBOLS[cell]?.color || 'bg-white'
//                                 } ${
//                                   isHighlight
//                                     ? 'ring-2 ring-theme-primary z-10 scale-110 shadow-lg'
//                                     : 'opacity-40 grayscale'
//                                 }`}
//                               >
//                                 {SYMBOLS[cell]?.symbol}
//                               </div>
//                             );
//                           })
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// --- 子組件: 專案播放器 (含區段提醒邏輯，提醒浮在 counter 上方) ---
function ProjectView({
  activeProjects,
  savedPatterns,
  yarns,
  onUpdateProject,
  onDeleteProject,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [plusN, setPlusN] = useState('');
  const [showAlertOverlay, setShowAlertOverlay] = useState(false); // NEW：控制提醒浮層顯示

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
      return { targetTotal: 0, activeSection: null };

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
        activeSection = { ...s, startRow, endRow: cumulativeRows };
      }

      return { ...s, totalRows: sectionTotal, startRow, endRow: cumulativeRows };
    });

    return { targetTotal: cumulativeRows, sectionsSummary: summary, activeSection };
  }, [currentPattern, currentProject?.totalRow]);

  if (!selectedId) {
    return (
      <div className="max-w-5xl mx-auto p-8 md:p-12 animate-fade-in pb-32">
        <h2 className="text-3xl font-black text-theme-text mb-10 tracking-tight">
          Active Projects
        </h2>
        <div className="grid gap-4">
          {activeProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="bg-white p-6 rounded-[2.5rem] shadow-cozy border border-white flex justify-between items-center active:scale-[0.98] transition cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-theme-bg rounded-2xl flex items-center justify-center text-theme-primary text-xl font-black shadow-inner">
                  R
                </div>
                <h3 className="font-bold text-theme-text text-lg leading-tight">
                  {p.patternName}
                </h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-4xl font-black text-theme-primary tabular-nums tracking-tighter">
                  {p.totalRow}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(p.id);
                  }}
                  className="text-gray-200 hover:text-red-400 px-2 transition-colors"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
          {activeProjects.length === 0 && (
            <div className="text-center py-24 opacity-30 font-black tracking-widest uppercase">
              No Active Projects
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentProject || !currentPattern) return null;

  // 目前排數變化
  const update = (d) =>
    onUpdateProject({
      ...currentProject,
      totalRow: Math.max(1, currentProject.totalRow + d),
      sectionRow: Math.max(1, currentProject.sectionRow + d),
    });

  // 計算目前要跳出的提醒
  const currentAlerts =
    currentPattern.alerts?.filter((a) => {
      if (
        a.sectionId &&
        a.sectionId !== 'ALL' &&
        projectStats.activeSection?.id !== a.sectionId
      ) {
        return false;
      }
      const val =
        a.type === 'SECTION' ? currentProject.sectionRow : currentProject.totalRow;
      return a.mode === 'EVERY'
        ? val > 0 && val % a.value === 0
        : val === a.value;
    }) || [];

  // 只要新出現提醒，就自動打開浮層
  useEffect(() => {
    if (currentAlerts.length > 0) {
      setShowAlertOverlay(true);
    }
  }, [currentAlerts.length]);

  const primaryAlert = currentAlerts[0];

  return (
    <div className="flex flex-col h-full bg-theme-bg animate-fade-in pb-20 overflow-hidden relative">
      {/* 浮在 counter 上方的提醒 */}
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
                {primaryAlert.mode === 'EVERY' ? 'Every' : 'At'} {primaryAlert.value}
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
          {currentProject.patternName}
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 no-scrollbar pb-40">
        {currentPattern.type === 'TEXT' && projectStats.targetTotal > 0 && (
          <div className="bg-white p-6 rounded-[2rem] shadow-cozy border border-white space-y-3 mt-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[9px] font-black uppercase opacity-40 tracking-widest block mb-1">
                  Currently Knitting 目前階段
                </span>
                <span className="font-black text-theme-text text-base tracking-tight">
                  {projectStats.activeSection?.title || 'Unknown'}
                </span>
              </div>
              <span className="font-black text-theme-primary tabular-nums text-lg">
                {currentProject.totalRow}
                <span className="opacity-20 mx-1">/</span>
                {projectStats.targetTotal}
                <span className="text-[9px] opacity-40 uppercase ml-1">Rows</span>
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
              ></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
          {/* 左邊：比較小一點的 counter */}
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
                      setShowAlertOverlay(false); // 按 - 也順便收提醒
                    }}
                    className="py-5 bg-theme-bg rounded-[2rem] text-theme-primary shadow-inner font-black text-3xl active:scale-95 transition"
                  >
                    −
                  </button>
                  <button
                    onClick={() => {
                      update(1);
                      setShowAlertOverlay(false); // 你要的：按 + 後提醒收起
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
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-cozy border border-white flex justify-between items-center">
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
            </div>
          </div>

          {/* 右邊：提醒從這裡移走了，專心放說明 / 圖表 */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-cozy border border-white min-h-[380px]">
              <h4 className="font-black text-theme-text border-b border-theme-bg pb-5 mb-8 flex items-center gap-3 tracking-widest uppercase text-[10px]">
                <Icons.Library /> Instruction Manual
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
          </div>
        </div>
      </div>
    </div>
  );
}


// --- 子組件: 織圖編輯器 ---
function EditorView({ pattern, onUpdate, onBack }) {
  const [data, setData] = useState({ ...pattern });
  const [activeTab, setActiveTab] = useState('CONTENT');
  const [selectedTool, setSelectedTool] = useState('KNIT');

  useEffect(() => {
    onUpdate(data);
  }, [data]);

  const totalRows = useMemo(() => {
    if (data.type !== 'TEXT') return 0;
    return data.textSections.reduce(
      (sum, s) => sum + (s.rowsPerLoop || 1) * (s.repeats || 1),
      0
    );
  }, [data.textSections]);

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
        <div className="p-10 bg-theme-bg/30 flex justify-between items-end">
          <div className="flex-1 mr-6">
            <label className="text-[10px] font-black opacity-30 uppercase tracking-widest block mb-2 pl-1 tracking-[0.2em]">
              Pattern Design
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full text-4xl font-black bg-transparent border-none p-0 focus:ring-0 tracking-tighter"
              placeholder="設計標題..."
            />
          </div>
          {data.type === 'TEXT' && (
            <div className="text-right pb-1">
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
                {data.sections.map((s) => (
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
                    文字段落管理 Sections
                  </h3>
                  <button
                    onClick={() =>
                      setData({
                        ...data,
                        textSections: [
                          ...data.textSections,
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
                {data.textSections.map((sec) => (
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
                            循環排數 / Rows per Loop
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
                            重複次數 / Repeats
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
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest tracking-[0.1em]">
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
                          {data.textSections.map((sec) => (
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

// --- 子組件: 織圖圖庫 ---
function LibraryView({
  savedPatterns,
  onDeletePattern,
  onNewPattern,
  onCreateProject,
  onEditPattern,
}) {
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 px-2">
        <div>
          <h2 className="text-4xl font-black text-theme-text tracking-tighter leading-none mb-3">
            Pattern Library
          </h2>
          <p className="text-sm font-black opacity-30 uppercase tracking-[0.2em]">
            您的私人編織筆記本
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              onNewPattern('CHART');
            }}
            className="bg-theme-primary/10 text-theme-primary px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-theme-primary/10 transition-all hover:bg-theme-primary hover:text-white shadow-sm"
          >
            + CHART
          </button>
          <button
            onClick={() => {
              onNewPattern('TEXT');
            }}
            className="bg-theme-primary text-white px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-theme-primary/20 transition-all hover:opacity-80"
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
                    ? 'bg-indigo-50 text-indigo-400'
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
            <div className="text-[10px] font-black text-theme-primary opacity-50 uppercase tracking-widest mb-10 relative z-10">
              {ptn.category} · {new Date(ptn.updatedAt).toLocaleDateString()}
            </div>
            <button
              onClick={() =>
                onCreateProject(ptn)
              }
              className="w-full py-6 bg-theme-primary text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:shadow-2xl hover:shadow-theme-primary/30 transition-all mt-auto"
            >
              Start Knitting
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 根組件: App ---
function App() {
  const [view, setView] = useState('PROJECTS');
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [themeKey, setThemeKey] = useState('PURPLE');
  const [syncOpen, setSyncOpen] = useState(false);

  // 載入 localStorage
  useEffect(() => {
    const state = loadAppState();
    setSavedPatterns(state.savedPatterns);
    setActiveProjects(state.activeProjects);
    setYarns(state.yarns);
    setThemeKey(state.themeKey);
  }, []);

  // 儲存到 localStorage & 套用主題
  useEffect(() => {
    saveAppState({ savedPatterns, activeProjects, yarns, themeKey });
    const t = THEMES[themeKey] || THEMES.PURPLE;
    const r = document.documentElement;
    r.style.setProperty('--primary-color', t.primary);
    r.style.setProperty('--bg-color', t.bg);
    r.style.setProperty('--text-color', t.text);
    r.style.setProperty('--accent-color', t.accent);
    r.style.setProperty('--secondary-color', t.bg);
  }, [savedPatterns, activeProjects, yarns, themeKey]);

  const appStateForSync = {
    savedPatterns,
    activeProjects,
    yarns,
    themeKey,
  };

  const applyRemoteData = (remote) => {
    if (remote.savedPatterns) setSavedPatterns(remote.savedPatterns);
    if (remote.activeProjects) setActiveProjects(remote.activeProjects);
    if (remote.yarns) setYarns(remote.yarns);
    if (remote.themeKey) setThemeKey(remote.themeKey);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex w-24 bg-white border-r border-theme-accent/20 flex-col items-center py-12 space-y-12 z-30 shadow-sm relative">
        <div className="w-14 h-14 bg-theme-primary text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-theme-primary/20 font-black text-2xl transition-all cursor-pointer hover:rotate-12">
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
          {view === 'PROJECTS' && (
            <ProjectView
              yarns={yarns}
              savedPatterns={savedPatterns}
              activeProjects={activeProjects}
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
              savedPatterns={savedPatterns}
              onDeletePattern={(id) =>
                setSavedPatterns((prev) => prev.filter((x) => x.id !== id))
              }
              onNewPattern={(t) => {
                const p = createNewPattern(t);
                setCurrentPattern(p);
                setView('EDITOR');
              }}
              onCreateProject={(ptn) => {
                setActiveProjects((prev) => [
                  {
                    id: crypto.randomUUID(),
                    patternId: ptn.id,
                    patternName: ptn.name,
                    yarnId: null,
                    totalRow: 1,
                    sectionRow: 1,
                    lastActive: new Date().toISOString(),
                  },
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
          {view === 'EDITOR' && currentPattern && (
            <EditorView
              pattern={currentPattern}
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

        {/* Mobile Nav bar */}
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
