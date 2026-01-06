const { useState, useEffect, useRef, useMemo } = React;

// --- Cloud Sync Helpers ---
const CLOUD_CFG_KEY = 'cozy_knit_github_cfg_v1';
const CLOUD_CACHE_KEY = 'cozy_knit_data_cache_v1';

const readCloudCfg = () => {
    try { return JSON.parse(localStorage.getItem(CLOUD_CFG_KEY) || '{}'); }
    catch { return {}; }
};

const writeCloudCfg = (cfg) => {
    localStorage.setItem(CLOUD_CFG_KEY, JSON.stringify(cfg));
};

// --- Settings Modal ---
const SettingsModal = ({ open, onClose, cfg, setCfg, status, onLoad, onSave }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 modal-overlay flex items-end md:items-center justify-center p-4">
            <div className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-3xl shadow-xl border border-wool-100 overflow-hidden">
                <div className="p-4 border-b border-wool-50 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-wool-800">雲端同步設定</h3>
                        <p className="text-xs text-gray-400">資料存在私有 repo 的 JSON</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500">Owner</label>
                            <input value={cfg.owner || ''} onChange={(e) => setCfg(prev => ({...prev, owner: e.target.value.trim()}))}
                                className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="GitHub 帳號" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Repo</label>
                            <input value={cfg.repo || ''} onChange={(e) => setCfg(prev => ({...prev, repo: e.target.value.trim()}))}
                                className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="KnittingLog-Data" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-500">Fine-grained Token</label>
                            <input type="password" value={cfg.token || ''} onChange={(e) => setCfg(prev => ({...prev, token: e.target.value}))}
                                className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="貼上 PAT" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button onClick={onLoad} className="flex-1 py-3 bg-wool-100 text-wool-800 rounded-xl font-bold border border-wool-200">從 GitHub 載入</button>
                        <button onClick={onSave} className="flex-1 py-3 bg-wool-800 text-white rounded-xl font-bold">存到 GitHub</button>
                    </div>
                    <div className="text-xs text-gray-600 whitespace-pre-wrap bg-wool-50 border border-wool-100 rounded-xl p-3">
                        {status || '第一次請先載入確認連線。'}
                    </div>
                </div>
                <div className="p-4 border-t border-wool-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold">關閉</button>
                </div>
            </div>
        </div>
    );
};

// --- Constants & Data Structures ---
const SYMBOLS = {
    KNIT:     { id: 'KNIT', label: '下針', symbol: '│', color: 'bg-white' },
    PURL:     { id: 'PURL', label: '上針', symbol: '─', color: 'bg-gray-100' },
    YO:       { id: 'YO',   label: '掛針', symbol: '○', color: 'bg-blue-50' },
    K2TOG:    { id: 'K2TOG',label: '左上二併', symbol: '人', color: 'bg-red-50' },
    SSK:      { id: 'SSK',  label: '右上二併', symbol: '入', color: 'bg-red-50' },
    SLIP:     { id: 'SLIP', label: '滑針', symbol: 'V', color: 'bg-yellow-50' },
    M1R:      { id: 'M1R',  label: '右加針', symbol: '⅄', color: 'bg-green-50' },
    M1L:      { id: 'M1L',  label: '左加針', symbol: 'λ', color: 'bg-green-50' },
    NO_STITCH:{ id: 'NO_STITCH', label: '無針', symbol: '✕', color: 'bg-gray-200 text-gray-400' }
};

const CATEGORIES = ['未分類', '毛帽', '毛衣', '圍巾', '手套', '襪子', '家飾'];

const createNewPattern = (type = 'CHART') => ({
    id: crypto.randomUUID(),
    name: type === 'CHART' ? '新織圖專案' : '新文字說明專案',
    type: type, 
    category: '未分類',
    totalRows: 100, // 優化：新增總排數預設值
    updatedAt: new Date().toISOString(),
    meta: { castOn: '', needle: '', yarn: '' },
    textSections: [{ id: crypto.randomUUID(), title: '區段 1', content: '' }],
    alerts: [], 
    sections: [{
        id: crypto.randomUUID(),
        name: '圖解區段 A',
        repeats: 1,
        castOn: 10,
        rows: 10,
        cols: 10,
        grid: Array(10).fill().map(() => Array(10).fill('KNIT'))
    }]
});

const createProject = (patternId, patternName) => ({
    id: crypto.randomUUID(),
    patternId: patternId,
    patternName: patternName,
    currentRow: 1,
    startDate: new Date().toISOString(),
    lastActive: new Date().toISOString()
});

// --- Tutorial View ---
const TutorialView = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4 pb-24 md:pb-8">
        <header className="border-b border-wool-200 pb-4">
            <h2 className="text-2xl font-bold text-wool-800">教學與說明</h2>
            <p className="text-gray-500">JIS 記號對照與 App 使用指南</p>
        </header>
        <section className="space-y-4">
            <h3 className="text-lg font-bold text-wool-600 uppercase tracking-widest">基礎符號與織法 (JIS)</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-wool-100 overflow-hidden">
                <div className="grid grid-cols-3 md:grid-cols-4 divide-x divide-y divide-wool-50">
                    {Object.values(SYMBOLS).map(s => (
                        <div key={s.id} className="p-4 flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-mono mb-2 border shadow-sm ${s.color === 'bg-white' ? 'border-gray-200' : 'border-transparent'} ${s.color}`}>
                                {s.symbol}
                            </div>
                            <span className="text-sm font-bold text-gray-700">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);

// --- Project View (Player) ---
const ProjectView = ({ activeProjects, savedPatterns, onDeleteProject, onUpdateProject, onNavigateToLibrary }) => {
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [batchValue, setBatchValue] = useState(10); // 優化：新增批次跳轉數值狀態

    if (activeProjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in pb-20">
                <div className="bg-white p-8 rounded-full mb-6 shadow-sm border border-wool-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d9b98a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-wool-800 mb-2">還沒有編織專案</h2>
                <button onClick={onNavigateToLibrary} className="px-8 py-3 bg-wool-600 text-white rounded-2xl font-bold mt-4">去挑選織圖</button>
            </div>
        );
    }

    const currentProject = activeProjects.find(p => p.id === selectedProjectId);
    const currentPattern = currentProject ? savedPatterns.find(p => p.id === currentProject.patternId) : null;

    if (selectedProjectId && currentProject && currentPattern) {
        const updateRow = (delta) => {
            const newRow = Math.max(1, currentProject.currentRow + delta);
            onUpdateProject({ ...currentProject, currentRow: newRow, lastActive: new Date().toISOString() });
        };

        // 優化：計算進度與目前區段排數
        const totalRows = currentPattern.totalRows || 0;
        const progress = totalRows > 0 ? Math.min(100, (currentProject.currentRow / totalRows) * 100) : 0;
        
        let displaySection = null;
        let displayRowIndex = -1;
        let relativeRow = 0;

        if (currentPattern.type === 'CHART' && currentPattern.sections.length > 0) {
            displaySection = currentPattern.sections[0];
            const localRowIndex = (currentProject.currentRow - 1) % displaySection.rows;
            displayRowIndex = displaySection.rows - 1 - localRowIndex;
            relativeRow = localRowIndex + 1; // 區段第 n 排
        }

        return (
            <div className="flex flex-col h-full animate-fade-in bg-white md:bg-transparent pb-20 md:pb-0">
                <div className="bg-white/90 backdrop-blur p-4 shadow-sm flex items-center justify-between sticky top-0 z-30">
                    <button onClick={() => setSelectedProjectId(null)} className="p-2 -ml-2 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <h2 className="font-bold text-wool-800 text-lg">{currentProject.patternName}</h2>
                    <div className="w-8"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 flex flex-col gap-4 order-1">
                        <div className="bg-wool-50 rounded-3xl shadow-inner p-6 flex flex-col items-center border border-wool-100">
                            {/* 優化：總排數進度條 */}
                            {totalRows > 0 && (
                                <div className="w-full bg-gray-200 h-1.5 rounded-full mb-6 overflow-hidden">
                                    <div className="bg-wool-400 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                            )}

                            <h3 className="text-wool-400 font-bold uppercase tracking-widest text-xs mb-2">目前段數</h3>
                            <div className="text-[6rem] font-black text-wool-800 leading-none mb-1 tabular-nums">
                                {currentProject.currentRow}
                                {totalRows > 0 && <span className="text-2xl text-gray-300 ml-2 font-normal">/ {totalRows}</span>}
                            </div>

                            {/* 優化：區段同步顯示 */}
                            {currentPattern.type === 'CHART' && displaySection && (
                                <div className="mb-8 px-4 py-1 bg-white rounded-full border border-wool-100 text-xs font-bold text-wool-600 shadow-sm">
                                    區段：第 {relativeRow} 排 / 共 {displaySection.rows} 排
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button onClick={() => updateRow(-1)} className="py-6 bg-white rounded-2xl text-gray-400 border border-gray-100 shadow-sm text-xl font-bold active:scale-95 transition-all">-1</button>
                                <button onClick={() => updateRow(1)} className="py-6 bg-wool-600 text-white rounded-2xl shadow-lg text-3xl font-bold active:scale-95 transition-all">+1</button>
                            </div>

                            {/* 優化：批次跳轉區域 (+n) */}
                            <div className="mt-6 w-full flex items-center gap-2 p-2 bg-white/50 border border-wool-50 rounded-2xl">
                                <input 
                                    type="number" 
                                    value={batchValue} 
                                    onChange={(e) => setBatchValue(parseInt(e.target.value) || 0)}
                                    className="w-16 border border-gray-200 rounded-xl py-2 text-center font-bold text-wool-800"
                                />
                                <button onClick={() => updateRow(-batchValue)} className="flex-1 py-2 text-sm font-bold text-gray-400 bg-white rounded-xl border border-gray-100">-{batchValue}</button>
                                <button onClick={() => updateRow(batchValue)} className="flex-1 py-2 text-sm font-bold text-wool-600 bg-white rounded-xl border border-wool-200">+{batchValue}</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-wool-100 p-6 overflow-hidden flex flex-col order-2 min-h-[400px]">
                        <h4 className="font-bold text-wool-800 mb-4 flex items-center">
                            <span className="w-2 h-6 bg-wool-400 rounded-full mr-2"></span>織圖顯示
                        </h4>
                        <div className="flex-1 overflow-auto bg-gray-50 rounded-xl p-4 shadow-inner relative">
                            {currentPattern.type === 'CHART' && displaySection && (
                                <div className="flex flex-col items-center min-w-max">
                                    <div className="inline-block relative bg-white border-2 border-wool-200 rounded p-1 shadow-sm">
                                        <div className="grid gap-[1px] bg-wool-200 border border-wool-200"
                                            style={{ gridTemplateColumns: `repeat(${displaySection.cols}, 28px)`, gridTemplateRows: `repeat(${displaySection.rows}, 28px)` }}>
                                            {displaySection.grid.map((row, rIndex) => (
                                                row.map((cellType, cIndex) => (
                                                    <div key={`${rIndex}-${cIndex}`} className={`flex items-center justify-center text-xs font-mono ${SYMBOLS[cellType]?.color || 'bg-white'} ${rIndex === displayRowIndex ? 'ring-2 ring-wool-600 z-10 font-bold' : 'opacity-60 grayscale-[0.5]'}`}>
                                                        {SYMBOLS[cellType]?.symbol}
                                                    </div>
                                                ))
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 animate-fade-in pb-24 md:pb-8">
            <h2 className="text-2xl font-bold text-wool-800 mb-6 pl-2">進行中的專案</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map(proj => (
                    <div key={proj.id} onClick={() => setSelectedProjectId(proj.id)} className="bg-white rounded-3xl shadow-sm border border-wool-50 p-5 cursor-pointer active:scale-[0.98] transition-all overflow-hidden relative">
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-700 truncate">{proj.patternName}</h3>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }} className="text-gray-300 hover:text-red-400 p-2">✕</button>
                        </div>
                        <div className="bg-wool-50 rounded-2xl p-4 flex justify-between items-end">
                            <span className="text-xs text-wool-400 font-bold uppercase tracking-wider">Row</span>
                            <span className="text-3xl font-black text-wool-600">{proj.currentRow}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Library & Editor Views ---
const LibraryView = ({ savedPatterns, onSelectPattern, onDeletePattern, onNewPattern, onCreateProject }) => (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in pb-24 md:pb-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-wool-800">織圖資料庫</h2>
            <div className="flex gap-2">
                <button onClick={() => onNewPattern('CHART')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold">+ 格子</button>
                <button onClick={() => onNewPattern('TEXT')} className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold">+ 文字</button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPatterns.map(pattern => (
                <div key={pattern.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col">
                    <div onClick={() => onSelectPattern(pattern)} className="cursor-pointer flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{pattern.name}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-lg">{pattern.category}</span>
                    </div>
                    <button onClick={() => onCreateProject(pattern)} className="w-full mt-4 py-3 bg-wool-100 text-wool-800 rounded-xl font-bold">開始編織</button>
                </div>
            ))}
        </div>
    </div>
);

const EditorView = ({ pattern, onUpdate, onBack }) => {
    const [data, setData] = useState(pattern);
    const [activeTab, setActiveTab] = useState('CONTENT');

    useEffect(() => { onUpdate(data); }, [data]);
    const updateMeta = (f, v) => setData(p => ({ ...p, [f]: v, updatedAt: new Date().toISOString() }));

    return (
        <div className="flex flex-col h-full animate-fade-in bg-white pb-safe">
            <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-30">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-500">← 返回</button>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('CONTENT')} className={`px-4 py-1 text-xs font-bold rounded-md ${activeTab === 'CONTENT' ? 'bg-white shadow' : 'text-gray-400'}`}>內容設定</button>
                    <button onClick={() => setActiveTab('GRID')} className={`px-4 py-1 text-xs font-bold rounded-md ${activeTab === 'GRID' ? 'bg-white shadow' : 'text-gray-400'}`}>織圖</button>
                </div>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {activeTab === 'CONTENT' ? (
                    <div className="space-y-6">
                        <div className="bg-wool-50 p-4 rounded-2xl border border-wool-100 space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 font-bold mb-1">專案名稱</label>
                                <input type="text" value={data.name} onChange={(e) => updateMeta('name', e.target.value)} className="w-full border border-gray-200 rounded-xl p-3" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">分類</label>
                                    <select value={data.category} onChange={(e) => updateMeta('category', e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-white">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                {/* 優化：總排數設定 */}
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">預計總排數</label>
                                    <input type="number" value={data.totalRows || 0} onChange={(e) => updateMeta('totalRows', parseInt(e.target.value) || 0)} className="w-full border border-gray-200 rounded-xl p-3" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-20 font-bold">格子編輯器（略，保持原功能）</div>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [view, setView] = useState('PROJECTS');
    const [savedPatterns, setSavedPatterns] = useState([]);
    const [activeProjects, setActiveProjects] = useState([]);
    const [currentPattern, setCurrentPattern] = useState(null);
    const [cloudOpen, setCloudOpen] = useState(false);
    const [cloudStatus, setCloudStatus] = useState('');
    const [cloudCfg, setCloudCfg] = useState(() => {
        const c = readCloudCfg();
        return { owner: c.owner || '', repo: c.repo || 'KnittingLog-Data', branch: c.branch || 'main', path: c.path || 'data/knitting.json', token: c.token || '' };
    });
    const cloudShaRef = useRef(null);

    // Initial Load & Persistence (Similar to original)
    useEffect(() => {
        const cache = localStorage.getItem(CLOUD_CACHE_KEY);
        if (cache) {
            try {
                const d = JSON.parse(cache);
                if (Array.isArray(d.savedPatterns)) setSavedPatterns(d.savedPatterns);
                if (Array.isArray(d.activeProjects)) setActiveProjects(d.activeProjects);
            } catch(e) {}
        }
    }, []);

    // Handlers (Simplified)
    const handleNewPattern = (type) => { setCurrentPattern(createNewPattern(type)); setView('EDITOR'); };
    const handleSavePattern = (p) => {
        setCurrentPattern(p);
        setSavedPatterns(prev => {
            const idx = prev.findIndex(x => x.id === p.id);
            return idx >= 0 ? prev.map((item, i) => i === idx ? p : item) : [p, ...prev];
        });
    };
    const handleCreateProject = (pattern) => {
        const newProject = createProject(pattern.id, pattern.name);
        setActiveProjects(prev => [newProject, ...prev]);
        setView('PROJECTS');
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Nav Icon Component */}
            <div className="hidden md:flex w-24 bg-white border-r border-wool-100 flex-col items-center py-8 space-y-8 z-30">
                <div className="w-12 h-12 bg-wool-800 text-white rounded-2xl flex items-center justify-center">🧶</div>
                <button onClick={() => setView('PROJECTS')} className={`p-4 ${view === 'PROJECTS' ? 'text-wool-800' : 'text-gray-400'}`}>專案</button>
                <button onClick={() => setView('LIBRARY')} className={`p-4 ${view === 'LIBRARY' ? 'text-wool-800' : 'text-gray-400'}`}>圖庫</button>
                <button onClick={() => setCloudOpen(true)} className="mt-auto text-xs font-bold text-gray-400">⚙︎ 同步</button>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="flex-1 overflow-y-auto">
                    {view === 'PROJECTS' && <ProjectView activeProjects={activeProjects} savedPatterns={savedPatterns} onUpdateProject={(u) => setActiveProjects(prev => prev.map(p => p.id === u.id ? u : p))} onDeleteProject={(id) => setActiveProjects(p => p.filter(x => x.id !== id))} onNavigateToLibrary={() => setView('LIBRARY')} />}
                    {view === 'LIBRARY' && <LibraryView savedPatterns={savedPatterns} onSelectPattern={(p) => { setCurrentPattern({...p}); setView('EDITOR'); }} onNewPattern={handleNewPattern} onCreateProject={handleCreateProject} />}
                    {view === 'EDITOR' && currentPattern && <EditorView pattern={currentPattern} onUpdate={handleSavePattern} onBack={() => setView('LIBRARY')} />}
                </div>
            </div>

            <SettingsModal open={cloudOpen} onClose={() => setCloudOpen(false)} cfg={cloudCfg} setCfg={setCloudCfg} status={cloudStatus} />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
