const { useState, useEffect, useRef, useMemo } = React;

        // --- 1. ICONS ---
        const Icons = {
            Project: () => (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            ),
            Library: () => (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
            ),
            Yarn: () => (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a7 7 0 0 0-7 7c0 2.2 1 4.1 2.6 5.4" />
                    <path d="M12 3a7 7 0 0 1 7 7c0 2.2-1 4.1-2.6 5.4" />
                    <path d="M8 14c1.2 1 2.6 1.6 4 1.6s2.8-.6 4-1.6" />
                    <path d="M7 17h10" />
                    <path d="M9 21h6" />
                </svg>
            ),
        };

        // --- 1. SYMBOLS / CONSTANTS ---
        const SYMBOLS = {
            KNIT:     { id: 'KNIT', label: '下針', symbol: '∧', color: 'bg-gray-50' },
            PURL:     { id: 'PURL', label: '上針', symbol: '─', color: 'bg-gray-100' },
            YO:       { id: 'YO', label: '掛針', symbol: '○', color: 'bg-blue-50' },
            K2TOG:    { id: 'K2TOG', label: '左上二併', symbol: '人', color: 'bg-red-50' },
            SSK:      { id: 'SSK', label: '右上二併', symbol: '入', color: 'bg-red-50' },
            SLIP:     { id: 'SLIP', label: '滑針', symbol: 'V', color: 'bg-yellow-50' },
            M1R:      { id: 'M1R', label: '右加針', symbol: '⅄', color: 'bg-green-50' },
            M1L:      { id: 'M1L', label: '左加針', symbol: 'λ', color: 'bg-green-50' },
            NO_STITCH:{ id: 'NO_STITCH', label: '無針', symbol: '✕', color: 'bg-gray-200 text-gray-400' }
        };

        const CATEGORIES = ['未分類', '毛帽', '毛衣', '圍巾', '手套', '襪子', '家飾'];

        const createNewPattern = (type = 'CHART') => ({
            id: crypto.randomUUID(),
            name: type === 'CHART' ? '新織圖專案' : '新文字說明專案',
            type: type,
            category: '未分類',
            updatedAt: new Date().toISOString(),

            meta: {
                castOn: '',
                needle: '',
                yarn: ''
            },
            textSections: [
                { id: crypto.randomUUID(), title: '區段 1', content: '' }
            ],
            textContent: '',
            alerts: [],
            sections: [
                {
                    id: crypto.randomUUID(),
                    name: '圖解區段 A',
                    repeats: 1,
                    castOn: 10,
                    rows: 6,
                    cols: 10,
                    grid: Array(6).fill().map(() => Array(10).fill('KNIT'))
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

        // --- 2. 教學 ---
        const TutorialView = () => (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4 pb-24 md:pb-8">
                <header className="border-b border-wool-200 pb-4">
                    <h2 className="text-2xl font-bold text-wool-800">教學與說明</h2>
                    <p className="text-gray-500">JIS 記號對照與 App 使用指南</p>
                </header>

                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-wool-600 uppercase tracking-widest">App 功能指南</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-5 rounded-3xl shadow-sm border border-green-100">
                            <h4 className="font-bold text-green-800 mb-2">✨ 文字織圖模式</h4>
                            <p className="text-sm text-gray-600 mb-2">設定「起針數」、「針號」等固定資訊，並將織圖拆分成多個區段。支援快捷插入常用術語。</p>
                            <p className="text-xs text-gray-500">適合：照書本/影片做，想用文字記錄每段。</p>
                        </div>
                        <div className="bg-blue-50 p-5 rounded-3xl shadow-sm border border-blue-100">
                            <h4 className="font-bold text-blue-800 mb-2">🧩 圖解織圖模式</h4>
                            <p className="text-sm text-gray-600 mb-2">使用點格子方式建立織圖。可用工具列快速切換符號，點擊格子放置。</p>
                            <p className="text-xs text-gray-500">適合：想用簡單符號快速畫圖。</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-bold text-wool-600 uppercase tracking-widest">提醒功能</h3>
                    <div className="bg-yellow-50 p-5 rounded-3xl border border-yellow-100">
                        <p className="text-sm text-gray-700 mb-2">
                            你可以在「織圖編輯」→「提醒」頁籤，新增「第 N 段提醒內容」。
                        </p>
                        <p className="text-xs text-gray-500">當專案段數進度達到設定段數時，系統會自動跳出提醒。</p>
                    </div>
                </section>
            </div>
        );

        // --- 3. 主要視圖：專案列表 ---
        const ProjectsView = ({ projects, patterns, onOpenProject, onDeleteProject, onCreateFromPattern }) => {
            const getPatternById = (id) => patterns.find(p => p.id === id);

            return (
                <div className="max-w-4xl mx-auto animate-fade-in p-4 pb-24 md:pb-8">
                    <header className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-wool-800">我的專案</h2>
                            <p className="text-sm text-gray-500">追蹤進度，快速回到正在編織的地方</p>
                        </div>
                    </header>

                    {projects.length === 0 ? (
                        <div className="text-center p-10 bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="text-4xl mb-3">🧶</div>
                            <div className="font-bold text-gray-700">尚未建立專案</div>
                            <div className="text-sm text-gray-500 mt-1">先到「圖庫」選擇織圖建立專案吧！</div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {projects.map(prj => {
                                const pat = getPatternById(prj.patternId);
                                return (
                                    <div key={prj.id} className="bg-white rounded-3xl shadow-cozy border border-gray-100 p-5">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-xs text-gray-400 font-bold">{pat?.category || '未分類'}</div>
                                                <div className="text-lg font-extrabold text-wool-800">{prj.patternName}</div>
                                                <div className="text-sm text-gray-500 mt-1">目前段數：<span className="font-bold">{prj.currentRow}</span></div>
                                            </div>
                                            <button onClick={() => onDeleteProject(prj.id)} className="text-xs font-bold text-gray-400 hover:text-red-500">結束</button>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button onClick={() => onOpenProject(prj)} className="flex-1 px-4 py-2 rounded-2xl bg-wool-800 text-white font-bold text-sm shadow">
                                                打開
                                            </button>
                                            {pat && (
                                                <button onClick={() => onCreateFromPattern(pat)} className="px-4 py-2 rounded-2xl bg-wool-50 border border-wool-100 text-wool-800 font-bold text-sm">
                                                    新建
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        };

        // --- 4. 圖庫 ---
        const LibraryView = ({ patterns, onNew, onOpen, onDelete, onImport, onExport, onCreateProject }) => {
            const [importText, setImportText] = useState('');
            const [showImport, setShowImport] = useState(false);

            return (
                <div className="max-w-4xl mx-auto animate-fade-in p-4 pb-24 md:pb-8">
                    <header className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-wool-800">織圖圖庫</h2>
                            <p className="text-sm text-gray-500">建立與管理你的織圖模板</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onNew('CHART')} className="px-4 py-2 rounded-2xl bg-wool-800 text-white font-bold text-sm shadow">+ 新織圖</button>
                            <button onClick={() => onNew('TEXT')} className="px-4 py-2 rounded-2xl bg-white border border-wool-100 text-wool-800 font-bold text-sm shadow-sm">+ 文字</button>
                        </div>
                    </header>

                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setShowImport(s => !s)} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-xs">匯入</button>
                        <button onClick={() => onExport()} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-xs">匯出全部</button>
                    </div>

                    {showImport && (
                        <div className="bg-white border border-gray-200 rounded-3xl p-4 mb-4">
                            <div className="text-sm font-bold text-gray-700 mb-2">貼上 JSON 後匯入</div>
                            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full h-32 border border-gray-200 rounded-2xl p-3 font-mono text-xs" placeholder="{ ... }" />
                            <div className="mt-3 flex gap-2 justify-end">
                                <button onClick={() => setShowImport(false)} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs">取消</button>
                                <button onClick={() => { try { onImport(JSON.parse(importText)); setImportText(''); setShowImport(false);} catch(e) { alert('JSON 格式錯誤'); } }} className="px-3 py-2 rounded-xl bg-wool-800 text-white font-bold text-xs">匯入</button>
                            </div>
                        </div>
                    )}

                    {patterns.length === 0 ? (
                        <div className="text-center p-10 bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="text-4xl mb-3">📚</div>
                            <div className="font-bold text-gray-700">尚未建立織圖</div>
                            <div className="text-sm text-gray-500 mt-1">點右上角「+ 新織圖」開始吧！</div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {patterns.map(p => (
                                <div key={p.id} className="bg-white rounded-3xl shadow-cozy border border-gray-100 p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-xs text-gray-400 font-bold">{p.category}</div>
                                            <div className="text-lg font-extrabold text-wool-800">{p.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{p.type === 'TEXT' ? '文字模式' : '圖解模式'}</div>
                                        </div>
                                        <button onClick={() => onDelete(p.id)} className="text-xs font-bold text-gray-400 hover:text-red-500">刪除</button>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button onClick={() => onOpen(p)} className="flex-1 px-4 py-2 rounded-2xl bg-wool-800 text-white font-bold text-sm shadow">
                                            編輯
                                        </button>
                                        <button onClick={() => onCreateProject(p)} className="px-4 py-2 rounded-2xl bg-wool-50 border border-wool-100 text-wool-800 font-bold text-sm">
                                            建立專案
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        // --- 4.5 線材庫 ---
        const YarnLibraryView = ({ yarns, setYarns }) => {
            const [open, setOpen] = useState(false);
            const [draft, setDraft] = useState({ brand: '', name: '', weight: '', color: '', note: '' });

            const add = () => {
                if (!draft.name.trim()) { alert('請填線材名稱'); return; }
                setYarns(prev => [
                    { id: crypto.randomUUID(), ...draft, updatedAt: new Date().toISOString() },
                    ...(prev || [])
                ]);
                setDraft({ brand: '', name: '', weight: '', color: '', note: '' });
                setOpen(false);
            };

            const remove = (id) => {
                if (!confirm('刪除此線材？')) return;
                setYarns(prev => (prev || []).filter(y => y.id !== id));
            };

            return (
                <div className="max-w-4xl mx-auto animate-fade-in p-4 pb-24 md:pb-8">
                    <header className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-wool-800">線材庫</h2>
                            <p className="text-sm text-gray-500">管理你手上的線材收藏</p>
                        </div>
                        <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-2xl bg-wool-800 text-white font-bold text-sm shadow">+ 新增</button>
                    </header>

                    {open && (
                        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-cozy mb-4">
                            <div className="font-extrabold text-wool-800 mb-3">新增線材</div>
                            <div className="grid md:grid-cols-2 gap-3">
                                <input value={draft.brand} onChange={(e)=>setDraft(p=>({...p, brand:e.target.value}))} className="border border-gray-200 rounded-2xl p-3 text-sm" placeholder="品牌 (brand)" />
                                <input value={draft.name} onChange={(e)=>setDraft(p=>({...p, name:e.target.value}))} className="border border-gray-200 rounded-2xl p-3 text-sm" placeholder="名稱 (name) *" />
                                <input value={draft.weight} onChange={(e)=>setDraft(p=>({...p, weight:e.target.value}))} className="border border-gray-200 rounded-2xl p-3 text-sm" placeholder="粗細/線重 (weight)" />
                                <input value={draft.color} onChange={(e)=>setDraft(p=>({...p, color:e.target.value}))} className="border border-gray-200 rounded-2xl p-3 text-sm" placeholder="色號 (color)" />
                                <input value={draft.note} onChange={(e)=>setDraft(p=>({...p, note:e.target.value}))} className="border border-gray-200 rounded-2xl p-3 text-sm md:col-span-2" placeholder="備註" />
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm">取消</button>
                                <button onClick={add} className="px-4 py-2 rounded-2xl bg-wool-800 text-white font-bold text-sm">新增</button>
                            </div>
                        </div>
                    )}

                    {(!yarns || yarns.length === 0) ? (
                        <div className="text-center p-10 bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="text-4xl mb-3">🧶</div>
                            <div className="font-bold text-gray-700">線材庫是空的</div>
                            <div className="text-sm text-gray-500 mt-1">點右上角新增你的第一捲線！</div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {(yarns || []).map(y => (
                                <div key={y.id} className="bg-white rounded-3xl shadow-cozy border border-gray-100 p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-lg font-extrabold text-wool-800">{y.name}</div>
                                            <div className="text-sm text-gray-500">{y.brand || '—'} · {y.weight || '—'}</div>
                                            <div className="text-xs text-gray-400 mt-1">色號：{y.color || '—'}</div>
                                            {y.note ? <div className="text-xs text-gray-400 mt-2">{y.note}</div> : null}
                                        </div>
                                        <button onClick={() => remove(y.id)} className="text-xs font-bold text-gray-400 hover:text-red-500">刪除</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        // --- 4.7 編輯器 ---
        const EditorView = ({ pattern, onUpdate, onBack }) => {
            const [data, setData] = useState(pattern);
            const [activeTab, setActiveTab] = useState('CONTENT');
            const [selectedTool, setSelectedTool] = useState('KNIT');

            useEffect(() => {
                let updated = false;
                const newData = { ...data };
                if (data.type === 'TEXT') {
                    if (!data.meta) { newData.meta = { castOn: '', needle: '', yarn: '' }; updated = true; }
                    if (!data.textSections) {
                        newData.textSections = data.textContent
                            ? [{ id: crypto.randomUUID(), title: '說明', content: data.textContent }]
                            : [{ id: crypto.randomUUID(), title: '區段 1', content: '' }];
                        updated = true;
                    }
                }
                if (updated) setData(newData);
            }, []);

            useEffect(() => { onUpdate(data); }, [data]);

            const updateMeta = (f, v) => setData(p => ({ ...p, [f]: v, updatedAt: new Date().toISOString() }));
            const updateTextMeta = (f, v) => setData(p => ({ ...p, meta: { ...(p.meta || {}), [f]: v }, updatedAt: new Date().toISOString() }));

            const addAlert = () => setData(p => ({ ...p, alerts: [...(p.alerts || []), { row: 1, message: '' }] }));
            const updateAlert = (idx, f, v) => {
                const newAlerts = [...(data.alerts || [])];
                newAlerts[idx] = { ...newAlerts[idx], [f]: v };
                setData(p => ({ ...p, alerts: newAlerts }));
            };
            const removeAlert = (idx) => {
                const newAlerts = [...(data.alerts || [])];
                newAlerts.splice(idx, 1);
                setData(p => ({ ...p, alerts: newAlerts }));
            };

            const addTextSection = () => setData(p => ({ ...p, textSections: [...(p.textSections || []), { id: crypto.randomUUID(), title: '新區段', content: '' }] }));
            const updateTextSection = (idx, f, v) => {
                const newSections = [...(data.textSections || [])];
                newSections[idx] = { ...newSections[idx], [f]: v };
                setData(p => ({ ...p, textSections: newSections }));
            };
            const removeTextSection = (idx) => {
                if (confirm('刪除此區段？')) {
                    const newSections = [...(data.textSections || [])];
                    newSections.splice(idx, 1);
                    setData(p => ({ ...p, textSections: newSections }));
                }
            };
            const insertText = (idx, text) => {
                const newSections = [...(data.textSections || [])];
                const currentContent = newSections[idx].content || '';
                newSections[idx].content = currentContent + (currentContent ? ' ' : '') + text;
                setData(p => ({ ...p, textSections: newSections }));
            };

            const handleCellClick = (sectionId, r, c) => {
                setData(prev => ({
                    ...prev,
                    sections: prev.sections.map(s => {
                        if (s.id !== sectionId) return s;
                        const newGrid = s.grid.map(row => [...row]);
                        newGrid[r][c] = selectedTool;
                        return { ...s, grid: newGrid };
                    })
                }));
            };

            return (
                <div className="flex flex-col h-full animate-fade-in bg-white pb-safe">
                    <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-30">
                        <button onClick={onBack} className="p-2 -ml-2 text-gray-500">← 返回</button>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setActiveTab('CONTENT')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'CONTENT' ? 'bg-white shadow text-wool-800' : 'text-gray-400'}`}>內容</button>
                            <button onClick={() => setActiveTab('ALERTS')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'ALERTS' ? 'bg-white shadow text-yellow-600' : 'text-gray-400'}`}>提醒</button>
                        </div>
                        <div className="w-8"></div>
                    </div>

                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <input type="text" value={data.name} onChange={(e) => updateMeta('name', e.target.value)} className="w-full font-bold text-lg text-wool-800 bg-transparent border-none p-0 focus:ring-0 mb-2" placeholder="專案名稱" />
                        <select value={data.category} onChange={(e) => updateMeta('category', e.target.value)} className="text-sm border-gray-200 rounded-lg py-1 px-2 bg-white text-gray-600">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 overflow-auto bg-white p-4 pb-20">
                        {activeTab === 'ALERTS' ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-700">段數提醒</h3>
                                    <button onClick={addAlert} className="text-sm bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg font-bold border border-yellow-100">+ 新增</button>
                                </div>
                                <div className="text-xs text-gray-400 mb-4 bg-yellow-50 p-2 rounded">
                                    小提示：這裡設定的提醒會在您編織到該段數時自動跳出。
                                </div>
                                {(data.alerts || []).map((alert, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="text-sm text-gray-500 whitespace-nowrap">第</span>
                                        <input type="number" value={alert.row} onChange={(e) => updateAlert(idx, 'row', parseInt(e.target.value || '0', 10))} className="w-12 border border-gray-200 rounded text-center py-1" />
                                        <span className="text-sm text-gray-500 whitespace-nowrap">段：</span>
                                        <input type="text" value={alert.message} onChange={(e) => updateAlert(idx, 'message', e.target.value)} className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm" placeholder="提醒內容" />
                                        <button onClick={() => removeAlert(idx)} className="text-red-300 p-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : data.type === 'TEXT' ? (
                            <div className="space-y-6">
                                <div className="bg-wool-50 p-4 rounded-xl border border-wool-100">
                                    <h3 className="text-xs font-bold text-wool-400 uppercase mb-3">基本資訊</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">起針數 (sts)</label>
                                            <input type="text" value={data.meta?.castOn || ''} onChange={(e) => updateTextMeta('castOn', e.target.value)} className="w-full border border-gray-200 rounded p-2 text-sm" placeholder="ex: 60" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">針號 (Needle)</label>
                                            <input type="text" value={data.meta?.needle || ''} onChange={(e) => updateTextMeta('needle', e.target.value)} className="w-full border border-gray-200 rounded p-2 text-sm" placeholder="ex: 5.0mm" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-gray-500 mb-1">線材 (Yarn)</label>
                                            <input type="text" value={data.meta?.yarn || ''} onChange={(e) => updateTextMeta('yarn', e.target.value)} className="w-full border border-gray-200 rounded p-2 text-sm" placeholder="ex: 美麗諾羊毛" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-wool-400 uppercase">織圖區段</h3>
                                    </div>
                                    {(data.textSections || []).map((section, idx) => (
                                        <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 p-2 flex justify-between items-center border-b border-gray-100">
                                                <input
                                                    type="text"
                                                    value={section.title}
                                                    onChange={(e) => updateTextSection(idx, 'title', e.target.value)}
                                                    className="bg-transparent font-bold text-gray-700 text-sm focus:outline-none w-full"
                                                />
                                                <button onClick={() => removeTextSection(idx)} className="text-gray-400 hover:text-red-400 px-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="p-2 bg-white">
                                                <div className="flex gap-2 overflow-x-auto pb-2 mb-1 no-scrollbar">
                                                    <button onClick={() => insertText(idx, 'K2tog')} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 whitespace-nowrap">+ K2tog</button>
                                                    <button onClick={() => insertText(idx, 'SSK')} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 whitespace-nowrap">+ SSK</button>
                                                    <button onClick={() => insertText(idx, 'M1R')} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 whitespace-nowrap">+ M1R</button>
                                                    <button onClick={() => insertText(idx, 'YO')} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 whitespace-nowrap">+ YO</button>
                                                </div>
                                                <textarea
                                                    value={section.content}
                                                    onChange={(e) => updateTextSection(idx, 'content', e.target.value)}
                                                    className="w-full h-32 text-sm p-2 focus:ring-0 border-none resize-none font-mono text-gray-600"
                                                    placeholder="輸入此區段的編織說明..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addTextSection} className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 text-sm hover:bg-gray-50">
                                        + 新增區段
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-white border-b border-gray-100 py-2 flex overflow-x-auto gap-2 items-center sticky top-0 z-10 -mx-4 px-4 shadow-sm">
                                    {Object.values(SYMBOLS).map((tool) => (
                                        <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className={`flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-lg border transition-all ${selectedTool === tool.id ? 'bg-wool-800 text-white shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100'}`}>
                                            <span className="text-sm font-mono">{tool.symbol}</span>
                                        </button>
                                    ))}
                                </div>
                                {data.sections.map(section => (
                                    <div key={section.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 overflow-hidden">
                                        <h4 className="font-bold mb-2 text-wool-700">{section.name}</h4>
                                        <div className="overflow-x-auto pb-2">
                                            <div className="grid gap-[1px] bg-gray-300 border border-gray-300 inline-block rounded overflow-hidden" style={{ gridTemplateColumns: `repeat(${section.cols}, 26px)` }}>
                                                {section.grid.map((row, r) => row.map((cell, c) => (
                                                    <div key={`${r}-${c}`} onClick={() => handleCellClick(section.id, r, c)} className="h-[26px] w-[26px] bg-white flex items-center justify-center text-xs cursor-pointer hover:bg-blue-50">
                                                        {SYMBOLS[cell]?.symbol}
                                                    </div>
                                                )))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        // --- 5. GitHub 雲端同步工具 ---
        const CLOUD_CFG_KEY = 'cozy_knit_cloud_cfg_v1';
        const CLOUD_CACHE_KEY = 'cozy_knit_cloud_cache_v1';

        const readCloudCfg = () => {
            try { return JSON.parse(localStorage.getItem(CLOUD_CFG_KEY) || '{}'); } catch (e) { return {}; }
        };
        const writeCloudCfg = (cfg) => localStorage.setItem(CLOUD_CFG_KEY, JSON.stringify(cfg));

        window.CozyKnitStorage = window.CozyKnitStorage || {
            async loadData(cfg) {
                const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}?ref=${cfg.branch}`;
                const res = await fetch(url, {
                    headers: {
                        'Authorization': `token ${cfg.token}`,
                        'Accept': 'application/vnd.github+json'
                    }
                });
                if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`);
                const j = await res.json();
                const content = atob(j.content.replace(/\n/g, ''));
                const data = JSON.parse(content || '{}');
                return { data, sha: j.sha };
            },

            async saveData(cfg, payload, sha) {
                const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`;
                const body = {
                    message: `Update knitting data ${new Date().toISOString()}`,
                    content: btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2)))),
                    branch: cfg.branch,
                    sha
                };
                const res = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${cfg.token}`,
                        'Accept': 'application/vnd.github+json'
                    },
                    body: JSON.stringify(body)
                });
                if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`);
                const j = await res.json();
                return { sha: j.content.sha };
            }
        };

        // --- 6. 主程式 ---
        const App = () => {
            const [view, setView] = useState('PROJECTS');

            // ✅ 主題：改成「陣列」版本，cycleTheme 不會炸、THEMES.map 也正常
            const THEME_KEY = 'cozy_knit_theme_v1';

            const THEMES = [
                { id: 'PURPLE', name: '莫蘭迪紫', cls: '' },
                { id: 'BLUE',   name: '莫蘭迪藍', cls: 'theme-blue' },
                { id: 'GREEN',  name: '墨綠',     cls: 'theme-green' },
                { id: 'MONO',   name: '黑灰白',   cls: 'theme-mono' },
            ];

            const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_KEY) || 'PURPLE');

            useEffect(() => {
                localStorage.setItem(THEME_KEY, themeId);
            }, [themeId]);

            const cycleTheme = () => {
                const i = THEMES.findIndex(t => t.id === themeId);
                const next = THEMES[(i + 1) % THEMES.length].id;
                setThemeId(next);
            };

            const [cloudOpen, setCloudOpen] = useState(false);
            const [cloudStatus, setCloudStatus] = useState('');
            const [cloudCfg, setCloudCfg] = useState(() => {
                const c = readCloudCfg();
                return {
                    owner: c.owner || '',
                    repo: c.repo || 'KnittingLog-Data',
                    branch: c.branch || 'main',
                    path: c.path || 'data/knitting.json',
                    token: c.token || ''
                };
            });
            const cloudShaRef = useRef(null);

            const persistCloudCfg = (cfg) => {
                writeCloudCfg(cfg);
                setCloudCfg(cfg);
            };

            const [savedPatterns, setSavedPatterns] = useState(() => {
                try { return JSON.parse(localStorage.getItem('cozy_knit_patterns_v6') || '[]'); } catch (e) { return []; }
            });
            const [activeProjects, setActiveProjects] = useState(() => {
                try { return JSON.parse(localStorage.getItem('cozy_knit_projects_v6') || '[]'); } catch (e) { return []; }
            });
            const [yarnLibrary, setYarnLibrary] = useState(() => {
                try { return JSON.parse(localStorage.getItem('cozy_knit_yarns_v1') || '[]'); } catch (e) { return []; }
            });

            const [currentPattern, setCurrentPattern] = useState(null);

            useEffect(() => {
                localStorage.setItem('cozy_knit_patterns_v6', JSON.stringify(savedPatterns));
                try {
                    const cur = JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY) || '{}');
                    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify({ ...cur, version: 1, updatedAt: new Date().toISOString(), savedPatterns }));
                } catch (e) {}
            }, [savedPatterns]);

            useEffect(() => {
                localStorage.setItem('cozy_knit_projects_v6', JSON.stringify(activeProjects));
                try {
                    const cur = JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY) || '{}');
                    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify({ ...cur, version: 1, updatedAt: new Date().toISOString(), activeProjects }));
                } catch (e) {}
            }, [activeProjects]);

            useEffect(() => {
                localStorage.setItem('cozy_knit_yarns_v1', JSON.stringify(yarnLibrary));
                try {
                    const cur = JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY) || '{}');
                    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify({ ...cur, version: 1, updatedAt: new Date().toISOString(), yarnLibrary }));
                } catch (e) {}
            }, [yarnLibrary]);

            const loadFromCloud = async () => {
                const cfg = { ...cloudCfg };
                persistCloudCfg(cfg);

                if (!cfg.owner || !cfg.repo || !cfg.branch || !cfg.path || !cfg.token) {
                    setCloudStatus('請先填 Owner / Token（Token 需對私有資料 repo 有 Contents read/write）。');
                    return;
                }

                setCloudStatus('載入中…');
                try {
                    const { data, sha } = await window.CozyKnitStorage.loadData(cfg);
                    cloudShaRef.current = sha;
                    setSavedPatterns(data.savedPatterns || []);
                    setActiveProjects(data.activeProjects || []);
                    setYarnLibrary(data.yarnLibrary || []);
                    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(data));
                    setCloudStatus(`載入成功 ✅（sha: ${String(sha).slice(0, 7)}…）`);
                } catch (e) {
                    console.error(e);
                    setCloudStatus('載入失敗：' + (e?.message || String(e)));
                }
            };

            const saveToCloud = async () => {
                const cfg = { ...cloudCfg };
                persistCloudCfg(cfg);

                if (!cfg.owner || !cfg.repo || !cfg.branch || !cfg.path || !cfg.token) {
                    setCloudStatus('請先填 Owner / Token（Token 需對私有資料 repo 有 Contents read/write）。');
                    return;
                }

                if (!cloudShaRef.current) {
                    setCloudStatus('還沒載入過雲端資料，先按「從 GitHub 載入」。');
                    return;
                }

                setCloudStatus('存檔中…');
                try {
                    const payload = {
                        version: 1,
                        updatedAt: new Date().toISOString(),
                        savedPatterns,
                        activeProjects,
                        yarnLibrary
                    };
                    const { sha } = await window.CozyKnitStorage.saveData(cfg, payload, cloudShaRef.current);
                    cloudShaRef.current = sha;
                    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(payload));
                    setCloudStatus(`存檔成功 ✅（sha: ${String(sha).slice(0, 7)}…）`);
                } catch (e) {
                    console.error(e);
                    setCloudStatus('存檔失敗：' + (e?.message || String(e)));
                }
            };

            const handleNewPattern = (type) => { setCurrentPattern(createNewPattern(type)); setView('EDITOR'); };
            const handleSelectPattern = (p) => { setCurrentPattern({ ...p }); setView('EDITOR'); };
            const handleDeletePattern = (id) => { if (confirm('刪除織圖？')) setSavedPatterns(p => p.filter(x => x.id !== id)); };
            const handleSavePattern = (p) => {
                setCurrentPattern(p);
                setSavedPatterns(prev => {
                    const idx = prev.findIndex(x => x.id === p.id);
                    return idx >= 0 ? prev.map((item, i) => i === idx ? p : item) : [p, ...prev];
                });
            };
            const handleImport = (json) => setSavedPatterns(p => [{ ...json, id: crypto.randomUUID(), name: json.name + '(匯入)' }, ...p]);
            const handleCreateProject = (pattern) => {
                const newProject = createProject(pattern.id, pattern.name);
                setActiveProjects(prev => [newProject, ...prev]);
                setView('PROJECTS');
            };
            const handleUpdateProject = (updatedProj) => { setActiveProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p)); };
            const handleDeleteProject = (id) => { if (confirm('結束專案？')) setActiveProjects(p => p.filter(x => x.id !== id)); };

            const NavIcon = ({ icon, label, active, onClick }) => (
                <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 transition-all duration-300 ${active ? 'text-wool-800 scale-105' : 'text-gray-400 hover:text-gray-500'}`}>
                    {icon}
                    <span className={`text-[10px] mt-1 font-bold ${active ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>{label}</span>
                </button>
            );

            const exportAll = () => {
                const payload = { version: 1, updatedAt: new Date().toISOString(), savedPatterns, activeProjects, yarnLibrary };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cozy-knit-export-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
            };

            const openProject = (prj) => {
                const pat = savedPatterns.find(p => p.id === prj.patternId);
                if (!pat) { alert('找不到織圖模板'); return; }
                setCurrentPattern({ ...pat, _project: prj });
                setView('EDITOR');
            };

            const onEditorUpdate = (p) => {
                setCurrentPattern(p);
            };

            const onEditorBack = () => {
                if (currentPattern?._project) {
                    const updated = { ...currentPattern._project, lastActive: new Date().toISOString() };
                    setActiveProjects(prev => prev.map(x => x.id === updated.id ? updated : x));
                }
                setView('LIBRARY');
            };

            const onSaveFromEditor = () => {
                if (!currentPattern) return;
                handleSavePattern(currentPattern);
                setView('LIBRARY');
            };

            const themeCls = (THEMES.find(x => x.id === themeId)?.cls) || '';

            return (
                <div className={`flex h-screen overflow-hidden ${themeCls}`}>
                    {/* Desktop Sidebar */}
                    <div className="hidden md:flex w-24 bg-white border-r border-wool-100 flex-col items-center py-8 space-y-8 z-30 shadow-sm relative">
                        <div className="w-12 h-12 bg-wool-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-wool-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.2 16.6l-5.6-3.2 5.6-3.2c.8-.5.8-1.9-.3-2.3L15.3 5.4c-.9-.4-2-.2-2.5.5L7.9 14.5c-.5.8-1.7.8-2.2-.1L3.3 12c-.5-.9.1-1.9 1.1-1.9H12" />
                                <path d="M12 22V12" />
                            </svg>
                        </div>

                        <nav className="flex flex-col space-y-6 w-full items-center">
                            <NavIcon active={view === 'PROJECTS'} onClick={() => setView('PROJECTS')} icon={<Icons.Project />} label="專案" />
                            <NavIcon active={view === 'YARNS'} onClick={() => setView('YARNS')} icon={<Icons.Yarn />} label="線材" />
                            <NavIcon active={view === 'LIBRARY' || view === 'EDITOR'} onClick={() => setView('LIBRARY')} icon={<Icons.Library />} label="圖庫" />
                            <NavIcon active={view === 'TUTORIAL'} onClick={() => setView('TUTORIAL')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>} label="教學" />
                        </nav>

                        <button onClick={() => setCloudOpen(true)} className="mt-auto mb-2 text-xs font-bold text-gray-400 hover:text-wool-700">⚙︎ 雲端同步</button>

                        {/* ✅ 主題切換（不會白屏版本） */}
                        <div className="mt-3 flex flex-col gap-2">
                            <button onClick={cycleTheme} className="text-xs font-bold text-gray-400 hover:text-wool-700">🎨 切換主題</button>

                            <div className="flex flex-col items-center gap-3">
                                <div className="flex gap-3">
                                    {THEMES.map(th => (
                                        <div
                                            key={th.id}
                                            className="theme-dot"
                                            title={th.name}
                                            style={{
                                                backgroundColor:
                                                    th.id === 'PURPLE' ? '#8e8499' :
                                                    th.id === 'BLUE' ? '#7da1c4' :
                                                    th.id === 'GREEN' ? '#5f7f78' : '#444444',
                                                opacity: themeId === th.id ? 1 : 0.35
                                            }}
                                            onClick={() => setThemeId(th.id)}
                                        />
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {THEMES.map(th => (
                                        <button
                                            key={th.id}
                                            onClick={() => setThemeId(th.id)}
                                            className={`px-2 py-2 rounded-xl border text-xs font-bold ${themeId === th.id
                                                ? 'bg-white border-wool-200 text-wool-800'
                                                : 'bg-wool-50 border-wool-100 text-gray-500 hover:bg-white'
                                            }`}
                                        >
                                            {th.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative pb-safe">
                        {/* Mobile Top Bar */}
                        <div className="md:hidden p-4 flex items-center justify-between bg-white/50 backdrop-blur sticky top-0 z-20">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-wool-800 text-white rounded-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.2 16.6l-5.6-3.2 5.6-3.2c.8-.5.8-1.9-.3-2.3L15.3 5.4c-.9-.4-2-.2-2.5.5L7.9 14.5c-.5.8-1.7.8-2.2-.1L3.3 12c-.5-.9.1-1.9 1.1-1.9H12" />
                                        <path d="M12 22V12" />
                                    </svg>
                                </div>
                                <span className="font-bold text-wool-800 text-lg">Cozy Knit</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCloudOpen(true)} className="px-3 py-2 bg-white border border-wool-100 rounded-xl text-xs font-bold text-wool-700 shadow-sm">同步</button>
                                <button onClick={cycleTheme} className="px-3 py-2 bg-white border border-wool-100 rounded-xl text-xs font-bold text-wool-700 shadow-sm">主題</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {view === 'TUTORIAL' && <TutorialView />}
                            {view === 'PROJECTS' && (
                                <ProjectsView
                                    projects={activeProjects}
                                    patterns={savedPatterns}
                                    onOpenProject={openProject}
                                    onDeleteProject={handleDeleteProject}
                                    onCreateFromPattern={handleCreateProject}
                                />
                            )}
                            {view === 'LIBRARY' && (
                                <LibraryView
                                    patterns={savedPatterns}
                                    onNew={handleNewPattern}
                                    onOpen={handleSelectPattern}
                                    onDelete={handleDeletePattern}
                                    onImport={handleImport}
                                    onExport={exportAll}
                                    onCreateProject={handleCreateProject}
                                />
                            )}
                            {view === 'YARNS' && (
                                <YarnLibraryView
                                    yarns={yarnLibrary}
                                    setYarns={setYarnLibrary}
                                />
                            )}
                            {view === 'EDITOR' && currentPattern && (
                                <div className="h-full flex flex-col">
                                    <EditorView pattern={currentPattern} onUpdate={onEditorUpdate} onBack={onEditorBack} />
                                    <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
                                        <button onClick={onSaveFromEditor} className="w-full py-3 rounded-2xl bg-wool-800 text-white font-bold shadow">
                                            儲存織圖
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cloud Modal */}
                    {cloudOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                            <div className="bg-white rounded-3xl shadow-cozy border border-gray-100 w-full max-w-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="font-extrabold text-wool-800 text-lg">雲端同步（GitHub 私有 repo）</div>
                                    <button onClick={() => setCloudOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs font-bold text-gray-500 mb-1">Owner</div>
                                        <input value={cloudCfg.owner || ''} onChange={(e) => setCloudCfg(prev => ({ ...prev, owner: e.target.value.trim() }))} className="w-full border border-gray-200 rounded-2xl p-3 text-sm" placeholder="mimi721156" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-500 mb-1">Repo</div>
                                        <input value={cloudCfg.repo || ''} onChange={(e) => setCloudCfg(prev => ({ ...prev, repo: e.target.value.trim() }))} className="w-full border border-gray-200 rounded-2xl p-3 text-sm" placeholder="KnittingLog-Data" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-500 mb-1">Branch</div>
                                        <input value={cloudCfg.branch || ''} onChange={(e) => setCloudCfg(prev => ({ ...prev, branch: e.target.value.trim() }))} className="w-full border border-gray-200 rounded-2xl p-3 text-sm" placeholder="main" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-500 mb-1">Path</div>
                                        <input value={cloudCfg.path || ''} onChange={(e) => setCloudCfg(prev => ({ ...prev, path: e.target.value.trim() }))} className="w-full border border-gray-200 rounded-2xl p-3 text-sm" placeholder="data/knitting.json" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="text-xs font-bold text-gray-500 mb-1">Token (Classic PAT)</div>
                                        <input value={cloudCfg.token || ''} onChange={(e) => setCloudCfg(prev => ({ ...prev, token: e.target.value }))} className="w-full border border-gray-200 rounded-2xl p-3 text-sm" placeholder="ghp_..." />
                                        <div className="text-[11px] text-gray-400 mt-1">需要 Contents: Read/Write 權限（repo 私有也可以）。</div>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2 justify-end">
                                    <button onClick={() => { persistCloudCfg(cloudCfg); }} className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm">儲存設定</button>
                                    <button onClick={loadFromCloud} className="px-4 py-2 rounded-2xl bg-white border border-wool-100 text-wool-800 font-bold text-sm">從 GitHub 載入</button>
                                    <button onClick={saveToCloud} className="px-4 py-2 rounded-2xl bg-wool-800 text-white font-bold text-sm shadow">存回 GitHub</button>
                                </div>

                                {cloudStatus && (
                                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                                        {cloudStatus}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
