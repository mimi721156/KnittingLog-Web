const { useState, useEffect, useRef, useMemo } = React;

// --- 0. 雲端同步設定與快取邏輯 (保留原始功能) ---
const CLOUD_CFG_KEY = 'cozy_knit_github_cfg_v1';
const CLOUD_CACHE_KEY = 'cozy_knit_data_cache_v1';

const readCloudCfg = () => {
    try { return JSON.parse(localStorage.getItem(CLOUD_CFG_KEY) || '{}'); }
    catch { return {}; }
};

const writeCloudCfg = (cfg) => {
    localStorage.setItem(CLOUD_CFG_KEY, JSON.stringify(cfg));
};

// --- 1. 定義符號與資料結構 ---
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
    totalRows: 100, // 優化：新增預計總排數
    updatedAt: new Date().toISOString(),
    meta: { castOn: '', needle: '', yarn: '' },
    textSections: [ { id: crypto.randomUUID(), title: '區段 1', content: '' } ],
    alerts: [], 
    sections: [
        {
            id: crypto.randomUUID(),
            name: '圖解區段 A',
            repeats: 1,
            castOn: 10,
            rows: 10,
            cols: 10,
            grid: Array(10).fill().map(() => Array(10).fill('KNIT'))
        }
    ]
});

const createProject = (patternId, patternName) => ({
    id: crypto.randomUUID(),
    patternId: patternId,
    patternName: patternName,
    currentRow: 1,
    startDate: new Date().toISOString(),
    lastActive: new Date().toISOString()
});

// --- 2. 元件：雲端設定彈窗 (SettingsModal) ---
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
                            <input value={cfg.owner || ''} onChange={(e) => setCfg(prev => ({...prev, owner: e.target.value.trim()}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Repo</label>
                            <input value={cfg.repo || ''} onChange={(e) => setCfg(prev => ({...prev, repo: e.target.value.trim()}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-500">Fine-grained Token</label>
                            <input type="password" value={cfg.token || ''} onChange={(e) => setCfg(prev => ({...prev, token: e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button onClick={onLoad} className="flex-1 py-3 bg-wool-100 text-wool-800 rounded-xl font-bold border border-wool-200">從 GitHub 載入</button>
                        <button onClick={onSave} className="flex-1 py-3 bg-wool-800 text-white rounded-xl font-bold">存到 GitHub</button>
                    </div>
                    <div className="text-xs text-gray-600 bg-wool-50 p-3 rounded-xl">{status}</div>
                </div>
                <div className="p-4 border-t border-wool-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold">關閉</button>
                </div>
            </div>
        </div>
    );
};

// --- 3. 元件：專案管理與播放器 (ProjectView) ---
const ProjectView = ({ activeProjects, savedPatterns, onDeleteProject, onUpdateProject, onNavigateToLibrary }) => {
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [batchValue, setBatchValue] = useState(10); // 優化：自定義跳轉排數

    const currentProject = activeProjects.find(p => p.id === selectedProjectId);
    const currentPattern = currentProject ? savedPatterns.find(p => p.id === currentProject.patternId) : null;

    if (!selectedProjectId || !currentProject || !currentPattern) {
        return (
            <div className="max-w-5xl mx-auto p-4 animate-fade-in pb-24">
                <h2 className="text-2xl font-bold text-wool-800 mb-6">進行中的專案</h2>
                {activeProjects.length === 0 ? (
                    <div className="text-center py-20">
                        <button onClick={onNavigateToLibrary} className="px-8 py-3 bg-wool-600 text-white rounded-2xl font-bold">去挑選織圖</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeProjects.map(proj => (
                            <div key={proj.id} onClick={() => setSelectedProjectId(proj.id)} className="bg-white rounded-3xl shadow-sm border border-wool-50 p-5 cursor-pointer relative">
                                <h3 className="font-bold text-gray-700 mb-4">{proj.patternName}</h3>
                                <div className="bg-wool-50 rounded-2xl p-4 flex justify-between items-end">
                                    <span className="text-xs text-wool-400 font-bold">Row</span>
                                    <span className="text-3xl font-black text-wool-600">{proj.currentRow}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }} className="absolute top-4 right-4 text-gray-300">✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // 播放器模式邏輯
    const updateRow = (delta) => {
        const newRow = Math.max(1, currentProject.currentRow + delta);
        onUpdateProject({ ...currentProject, currentRow: newRow, lastActive: new Date().toISOString() });
    };

    const totalRows = currentPattern.totalRows || 0;
    const progress = totalRows > 0 ? Math.min(100, (currentProject.currentRow / totalRows) * 100) : 0;
    
    let displaySection = null;
    let displayRowIndex = -1;
    let relativeRow = 0;
    if (currentPattern.type === 'CHART' && currentPattern.sections?.length > 0) {
        displaySection = currentPattern.sections[0];
        const localIdx = (currentProject.currentRow - 1) % displaySection.rows;
        displayRowIndex = displaySection.rows - 1 - localIdx;
        relativeRow = localIdx + 1;
    }

    return (
        <div className="flex flex-col h-full bg-white animate-fade-in">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <button onClick={() => setSelectedProjectId(null)} className="text-gray-500">← 返回</button>
                <h2 className="font-bold text-wool-800">{currentProject.patternName}</h2>
                <div className="w-8"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    <div className="bg-wool-50 rounded-3xl p-6 border border-wool-100 flex flex-col items-center">
                        {totalRows > 0 && (
                            <div className="w-full bg-gray-200 h-1.5 rounded-full mb-6 overflow-hidden">
                                <div className="bg-wool-400 h-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                        <span className="text-xs text-wool-400 font-bold">目前段數</span>
                        <div className="text-7xl font-black text-wool-800 my-2">
                            {currentProject.currentRow}
                            {totalRows > 0 && <span className="text-xl text-gray-300 ml-2 font-normal">/ {totalRows}</span>}
                        </div>
                        {relativeRow > 0 && (
                            <div className="mb-6 px-4 py-1 bg-white rounded-full text-xs font-bold text-wool-600 shadow-sm">
                                區段第 {relativeRow} 排 / 共 {displaySection.rows} 排
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button onClick={() => updateRow(-1)} className="py-6 bg-white rounded-2xl border font-bold">-1</button>
                            <button onClick={() => updateRow(1)} className="py-6 bg-wool-600 text-white rounded-2xl font-bold text-2xl">+1</button>
                        </div>
                        <div className="mt-6 flex w-full gap-2 p-2 bg-white rounded-2xl border border-wool-50">
                            <input type="number" value={batchValue} onChange={(e) => setBatchValue(parseInt(e.target.value) || 0)} className="w-16 border rounded-xl text-center font-bold" />
                            <button onClick={() => updateRow(-batchValue)} className="flex-1 py-2 bg-gray-50 rounded-xl text-sm">-{batchValue}</button>
                            <button onClick={() => updateRow(batchValue)} className="flex-1 py-2 bg-wool-100 rounded-xl text-sm font-bold">+{batchValue}</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-gray-50 rounded-3xl p-6 overflow-auto border">
                    {currentPattern.type === 'CHART' && displaySection ? (
                        <div className="min-w-max flex flex-col items-center">
                            <div className="grid gap-[1px] bg-wool-200 border p-1 bg-white rounded shadow-sm" style={{ gridTemplateColumns: `repeat(${displaySection.cols}, 28px)` }}>
                                {displaySection.grid.map((row, r) => row.map((cell, c) => (
                                    <div key={`${r}-${c}`} className={`h-7 w-7 flex items-center justify-center text-xs font-mono ${SYMBOLS[cell]?.color} ${r === displayRowIndex ? 'ring-2 ring-wool-600 z-10 font-bold' : 'opacity-50'}`}>
                                        {SYMBOLS[cell]?.symbol}
                                    </div>
                                )))}
                            </div>
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap font-mono text-gray-600">{currentPattern.textSections?.[0]?.content || "無文字內容"}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 4. 元件：織圖庫 (LibraryView) ---
const LibraryView = ({ savedPatterns, onSelectPattern, onDeletePattern, onNewPattern, onCreateProject }) => (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in pb-24">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-wool-800">織圖資料庫</h2>
            <div className="flex gap-2">
                <button onClick={() => onNewPattern('CHART')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold">+ 格子</button>
                <button onClick={() => onNewPattern('TEXT')} className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold">+ 文字</button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPatterns.map(p => (
                <div key={p.id} className="bg-white rounded-3xl shadow-sm border p-5 flex flex-col">
                    <div onClick={() => onSelectPattern(p)} className="cursor-pointer flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{p.name}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-lg">{p.category}</span>
                    </div>
                    <button onClick={() => onCreateProject(p)} className="w-full mt-4 py-3 bg-wool-100 text-wool-800 rounded-xl font-bold">開始編織</button>
                    <button onClick={() => onDeletePattern(p.id)} className="text-xs text-gray-300 mt-2">刪除織圖</button>
                </div>
            ))}
        </div>
    </div>
);

// --- 5. 元件：編輯器 (EditorView) ---
const EditorView = ({ pattern, onUpdate, onBack }) => {
    const [data, setData] = useState(pattern);
    const [activeTab, setActiveTab] = useState('CONTENT');

    useEffect(() => { onUpdate(data); }, [data]);
    const updateMeta = (f, v) => setData(p => ({ ...p, [f]: v, updatedAt: new Date().toISOString() }));

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b flex items-center justify-between">
                <button onClick={onBack} className="text-gray-500">← 返回</button>
                <div className="bg-gray-100 p-1 rounded-lg flex">
                    <button onClick={() => setActiveTab('CONTENT')} className={`px-4 py-1 text-xs font-bold rounded ${activeTab === 'CONTENT' ? 'bg-white shadow' : ''}`}>內容</button>
                    <button onClick={() => setActiveTab('GRID')} className={`px-4 py-1 text-xs font-bold rounded ${activeTab === 'GRID' ? 'bg-white shadow' : ''}`}>格子</button>
                </div>
                <div className="w-8"></div>
            </div>
            <div className="flex-1 overflow-auto p-4">
                {activeTab === 'CONTENT' ? (
                    <div className="space-y-4 max-w-md mx-auto">
                        <div>
                            <label className="text-xs font-bold text-gray-400">名稱</label>
                            <input type="text" value={data.name} onChange={(e) => updateMeta('name', e.target.value)} className="w-full border p-3 rounded-xl" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">預計總排數 (優化功能)</label>
                            <input type="number" value={data.totalRows || 0} onChange={(e) => updateMeta('totalRows', parseInt(e.target.value) || 0)} className="w-full border p-3 rounded-xl" />
                        </div>
                        {data.type === 'TEXT' && (
                            <div>
                                <label className="text-xs font-bold text-gray-400">文字說明</label>
                                <textarea value={data.textSections[0].content} onChange={(e) => {
                                    const news = [...data.textSections];
                                    news[0].content = e.target.value;
                                    setData({...data, textSections: news});
                                }} className="w-full border p-3 rounded-xl h-40 font-mono" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-300">格子編輯器僅供預覽 (總排數優化請見內容分頁)</div>
                )}
            </div>
        </div>
    );
};

// --- 6. 主程式 (App) ---
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

    // 載入本地快取 (保留原始功能)
    useEffect(() => {
        const cache = localStorage.getItem(CLOUD_CACHE_KEY);
        if (cache) {
            try {
                const d = JSON.parse(cache);
                if (Array.isArray(d.savedPatterns)) setSavedPatterns(d.savedPatterns);
                if (Array.isArray(d.activeProjects)) setActiveProjects(d.activeProjects);
            } catch(e) {}
        }
        // 如果有雲端設定，自動嘗試載入
        if (cloudCfg.owner && cloudCfg.token) {
            setTimeout(loadFromCloud, 500);
        }
    }, []);

    // 雲端功能封裝 (使用 window 上的 helper)
    const loadFromCloud = async () => {
        setCloudStatus('載入中...');
        try {
            const { data, sha } = await window.CozyKnitStorage.loadData(cloudCfg);
            cloudShaRef.current = sha;
            setSavedPatterns(data.savedPatterns || []);
            setActiveProjects(data.activeProjects || []);
            localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(data));
            setCloudStatus('載入成功 ✅');
        } catch (e) { setCloudStatus('失敗: ' + e.message); }
    };

    const saveToCloud = async () => {
        setCloudStatus('儲存中...');
        try {
            const payload = { version: 1, updatedAt: new Date().toISOString(), savedPatterns, activeProjects };
            await window.CozyKnitStorage.saveData(cloudCfg, payload, cloudShaRef.current);
            setCloudStatus('已儲存到雲端 ✅');
        } catch (e) { setCloudStatus('儲存失敗: ' + e.message); }
    };

    // 導覽列與操作
    const handleNewPattern = (type) => { setCurrentPattern(createNewPattern(type)); setView('EDITOR'); };
    const handleSavePattern = (p) => {
        setSavedPatterns(prev => {
            const idx = prev.findIndex(x => x.id === p.id);
            return idx >= 0 ? prev.map(item => item.id === p.id ? p : item) : [p, ...prev];
        });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-knit-pattern">
            {/* Sidebar */}
            <div className="hidden md:flex w-24 bg-white border-r flex-col items-center py-8 space-y-6">
                <div className="text-2xl">🧶</div>
                <button onClick={() => setView('PROJECTS')} className={`p-2 rounded ${view === 'PROJECTS' ? 'bg-wool-100' : ''}`}>專案</button>
                <button onClick={() => setView('LIBRARY')} className={`p-2 rounded ${view === 'LIBRARY' ? 'bg-wool-100' : ''}`}>圖庫</button>
                <button onClick={() => setCloudOpen(true)} className="mt-auto text-xs text-gray-400">雲端</button>
            </div>

            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    {view === 'PROJECTS' && <ProjectView activeProjects={activeProjects} savedPatterns={savedPatterns} onDeleteProject={(id) => setActiveProjects(p => p.filter(x => x.id !== id))} onUpdateProject={(u) => setActiveProjects(p => p.map(x => x.id === u.id ? u : x))} onNavigateToLibrary={() => setView('LIBRARY')} />}
                    {view === 'LIBRARY' && <LibraryView savedPatterns={savedPatterns} onSelectPattern={(p) => {setCurrentPattern(p); setView('EDITOR');}} onDeletePattern={(id) => setSavedPatterns(p => p.filter(x => x.id !== id))} onNewPattern={handleNewPattern} onCreateProject={(p) => { setActiveProjects([createProject(p.id, p.name), ...activeProjects]); setView('PROJECTS'); }} />}
                    {view === 'EDITOR' && currentPattern && <EditorView pattern={currentPattern} onUpdate={handleSavePattern} onBack={() => setView('LIBRARY')} />}
                </div>

                {/* Mobile Tab Bar */}
                {view !== 'EDITOR' && (
                    <div className="md:hidden flex border-t bg-white p-3 justify-around">
                        <button onClick={() => setView('PROJECTS')} className={view === 'PROJECTS' ? 'font-bold text-wool-800' : ''}>專案</button>
                        <button onClick={() => setView('LIBRARY')} className={view === 'LIBRARY' ? 'font-bold text-wool-800' : ''}>圖庫</button>
                        <button onClick={() => setCloudOpen(true)}>同步</button>
                    </div>
                )}
            </div>

            <SettingsModal open={cloudOpen} onClose={() => setCloudOpen(false)} cfg={cloudCfg} setCfg={setCloudCfg} status={cloudStatus} onLoad={loadFromCloud} onSave={saveToCloud} />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
