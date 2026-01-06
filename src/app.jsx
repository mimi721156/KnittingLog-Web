const { useState, useEffect, useRef, useMemo } = React;

        // --- Cloud Sync (GitHub private repo JSON) ---
        const CLOUD_CFG_KEY = 'cozy_knit_github_cfg_v1';
        const CLOUD_CACHE_KEY = 'cozy_knit_data_cache_v1';

        const readCloudCfg = () => {
            try { return JSON.parse(localStorage.getItem(CLOUD_CFG_KEY) || '{}'); }
            catch { return {}; }
        };

        const writeCloudCfg = (cfg) => {
            localStorage.setItem(CLOUD_CFG_KEY, JSON.stringify(cfg));
        };

        const SettingsModal = ({ open, onClose, cfg, setCfg, status, onLoad, onSave }) => {
            if (!open) return null;
            return (
                <div className="fixed inset-0 z-50 modal-overlay flex items-end md:items-center justify-center p-4">
                    <div className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-3xl shadow-xl border border-brand-100 overflow-hidden">
                        <div className="p-4 border-b border-wool-50 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-[rgb(var(--brand-text))]">雲端同步設定</h3>
                                <p className="text-xs text-gray-400">資料存在私有 repo 的 JSON（需要 Fine-grained PAT）</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Owner</label>
                                    <input value={cfg.owner || ''} onChange={(e) => setCfg(prev => ({...prev, owner: e.target.value.trim()}))}
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="你的 GitHub 帳號" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Repo（私有資料 repo）</label>
                                    <input value={cfg.repo || ''} onChange={(e) => setCfg(prev => ({...prev, repo: e.target.value.trim()}))}
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="KnittingLog-Data" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Branch</label>
                                    <input value={cfg.branch || 'main'} onChange={(e) => setCfg(prev => ({...prev, branch: e.target.value.trim()}))}
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="main" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Path</label>
                                    <input value={cfg.path || 'data/knitting.json'} onChange={(e) => setCfg(prev => ({...prev, path: e.target.value.trim()}))}
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="data/knitting.json" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-gray-500">Fine-grained Token（Contents read/write）</label>
                                    <input type="password" value={cfg.token || ''} onChange={(e) => setCfg(prev => ({...prev, token: e.target.value}))}
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="貼上 PAT（只存在此瀏覽器）" />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button onClick={onLoad} className="flex-1 py-3 bg-brand-100 text-[rgb(var(--brand-text))] rounded-xl font-bold border border-brand-200">
                                    從 GitHub 載入
                                </button>
                                <button onClick={onSave} className="flex-1 py-3 bg-brand-800 text-white rounded-xl font-bold">
                                    存到 GitHub
                                </button>
                            </div>

                            <div className="text-xs text-gray-600 whitespace-pre-wrap bg-wool-50 border border-brand-100 rounded-xl p-3 min-h-[44px]">
                                {status || '小提醒：第一次先「載入」確認連線，再存檔。若開兩個分頁同時存，可能需要重新載入。'}
                            </div>
                        </div>

                        <div className="p-4 border-t border-wool-50 flex justify-end">
                            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold">關閉</button>
                        </div>
                    </div>
                </div>
            );
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

        // Parse rows string like: "1,3,5-8, every 4" (supports: numbers, ranges, "every N")
        const parseRowSpec = (spec, max = 9999) => {
            if (!spec) return [];
            const s = String(spec).toLowerCase().replaceAll('，', ',');
            const out = new Set();

            const everyMatch = s.match(/every\s*(\d+)/);
            if (everyMatch) {
                const step = Math.max(1, Number(everyMatch[1]));
                for (let i = step; i <= max; i += step) out.add(i);
            }

            s.split(',').map(x => x.trim()).filter(Boolean).forEach(part => {
                if (part.startsWith('every')) return;
                const range = part.split('-').map(x => x.trim());
                if (range.length === 2) {
                    const a = Number(range[0]); const b = Number(range[1]);
                    if (!Number.isFinite(a) || !Number.isFinite(b)) return;
                    const lo = Math.min(a,b); const hi = Math.max(a,b);
                    for (let i = lo; i <= hi && i <= max; i++) out.add(i);
                } else {
                    const n = Number(part);
                    if (Number.isFinite(n) && n >= 1 && n <= max) out.add(n);
                }
            });

            return Array.from(out).sort((a,b)=>a-b);
        };


        const CATEGORIES = ['未分類', '毛帽', '毛衣', '圍巾', '手套', '襪子', '家飾'];

        // V6 Updated Structure: Added 'meta' and 'textSections' for TEXT type
        const createNewPattern = (type = 'CHART') => ({
            id: crypto.randomUUID(),
            name: type === 'CHART' ? '新織圖專案' : '新文字說明專案',
            type: type, 
            category: '未分類',
            updatedAt: new Date().toISOString(),
            // Text Pattern Specific Fields
            meta: {
                castOn: '',
                needle: '',
                yarn: ''
            },
            textSections: [
                { id: crypto.randomUUID(), title: '區段 1', content: '' }
            ],
            // Legacy / Fallback
            textContent: '', 
            
            alerts: [], 
            // Chart Pattern Specific Fields
            sections: [
                {
                    id: crypto.randomUUID(),
                    name: '圖解區段 A',
                    repeats: 1,
                    castOn: 10,
                    rows: 6,
                    cols: 10,
                    grid: Array(6).fill().map(() => Array(10).fill('KNIT')),
                    rowRules: []
                }
            ]
        });

        const createProject = (patternId, patternName) => ({
            id: crypto.randomUUID(),
            patternId: patternId,
            patternName: patternName,
            currentRow: 1,
            startDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            needles: [],
            yarnsUsed: []
        });

        // --- 2. 頁面元件：教學 ---
        const TutorialView = () => (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4 pb-24 md:pb-8">
                <header className="border-b border-brand-200 pb-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--brand-text))]">教學與說明</h2>
                    <p className="text-gray-500">JIS 記號對照與 App 使用指南</p>
                </header>

                {/* 1. App Usage / New Features */}
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-wool-600 uppercase tracking-widest">App 功能指南</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-5 rounded-3xl shadow-sm border border-green-100">
                            <h4 className="font-bold text-green-800 mb-2">✨ 文字織圖模式</h4>
                            <p className="text-sm text-gray-600 mb-2">設定「起針數」、「針號」等固定資訊，並將織圖拆分成多個區段。支援快捷插入常用術語。</p>
                        </div>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-wool-50">
                            <h4 className="font-bold text-[rgb(var(--brand-text))] mb-2">🔔 智能提醒</h4>
                            <p className="text-sm text-gray-600">在編輯模式設定提醒（如：第6段加針），編織時計數器會自動跳出通知。</p>
                        </div>
                    </div>
                </section>

                {/* 2. Symbol Chart & Text Explanations */}
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-wool-600 uppercase tracking-widest">基礎符號與織法 (JIS)</h3>
                    
                    {/* Visual Grid */}
                    <div className="bg-white rounded-3xl shadow-sm border border-brand-100 overflow-hidden">
                        <div className="grid grid-cols-3 md:grid-cols-4 divide-x divide-y divide-wool-50">
                            {Object.values(SYMBOLS).map(s => (
                                <div key={s.id} className="p-4 flex flex-col items-center text-center">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-mono mb-2 border shadow-sm ${s.color === 'bg-white' ? 'border-gray-200' : 'border-transparent'} ${s.color}`}>
                                        {s.symbol}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{s.label}</span>
                                    <span className="text-[10px] text-gray-400 mt-1 font-mono">{s.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RESTORED: Detailed Explanations */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-100 space-y-6">
                        <div>
                            <h4 className="font-bold text-[rgb(var(--brand-text))] mb-2 flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                基礎針法
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc marker:text-blue-300">
                                <li><strong>下針 (│)</strong>：正面呈現 V 型。線在後方，從左側線圈左前方插入。</li>
                                <li><strong>上針 (─)</strong>：正面呈現波浪橫紋。線在前方，從左側線圈右後方插入。</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-[rgb(var(--brand-text))] mb-2 flex items-center">
                                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                減針 (Decreases)
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc marker:text-red-300">
                                <li><strong>左上二併 (人 / K2tog)</strong>：兩針一起織下針，織片向右傾斜。</li>
                                <li><strong>右上二併 (入 / SSK)</strong>：滑1織1，將滑針蓋過織針，織片向左傾斜。</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-[rgb(var(--brand-text))] mb-2 flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                加針 (Increases)
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc marker:text-green-300">
                                <li><strong>掛針 (○ / YO)</strong>：繞線不織，形成洞孔（蕾絲花樣用）。</li>
                                <li><strong>右加針 (⅄ / M1R)</strong>：挑起橫線織前腳（向右扭轉）。</li>
                                <li><strong>左加針 (λ / M1L)</strong>：挑起橫線織後腳（向左扭轉）。</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* RESTORED: Reading Tips */}
                <section className="bg-brand-100 p-6 rounded-3xl border border-brand-200">
                    <h3 className="font-bold text-[rgb(var(--brand-text))] mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                        新手小撇步：背面怎麼織？
                    </h3>
                    <div className="text-sm text-[rgb(var(--brand-text))] mb-2">
                        記住口訣：「<strong>看著圖織相反</strong>」。
                    </div>
                    <ul className="list-disc list-inside text-sm text-wool-700 ml-1 space-y-1">
                        <li>圖上畫「│」(下針) → 片織背面時織「<strong>上針</strong>」</li>
                        <li>圖上畫「─」(上針) → 片織背面時織「<strong>下針</strong>」</li>
                        <li className="text-wool-500 mt-2 text-xs ml-0 list-none pl-4 border-l-2 border-wool-300">註：圈織（一直繞圈）因為永遠在正面，直接照圖織即可。</li>
                    </ul>
                </section>
            </div>
        );

        
        // --- 2.5 頁面元件：線材庫 ---
        const YarnLibraryView = ({ yarnLibrary, onAddYarn, onUpdateYarn, onDeleteYarn }) => {
            const [open, setOpen] = useState(false);
            const [editing, setEditing] = useState(null);

            const empty = {
                id: crypto.randomUUID(),
                brand: '',
                line: '',
                weight: '',
                colorName: '',
                colorCode: '',
                fiber: '',
                notes: ''
            };

            const [form, setForm] = useState(empty);

            const startAdd = () => {
                setEditing(null);
                setForm({ ...empty, id: crypto.randomUUID() });
                setOpen(true);
            };

            const startEdit = (y) => {
                setEditing(y);
                setForm({ ...y });
                setOpen(true);
            };

            const save = () => {
                const payload = { ...form, brand: form.brand.trim(), line: form.line.trim(), weight: form.weight.trim(), colorName: form.colorName.trim(), colorCode: form.colorCode.trim(), fiber: form.fiber.trim(), notes: form.notes.trim() };
                if (!payload.brand && !payload.line) return;
                if (editing) onUpdateYarn(payload);
                else onAddYarn(payload);
                setOpen(false);
            };

            return (
                <div className="max-w-4xl mx-auto h-full p-4 pb-24 md:pb-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[rgb(var(--brand-text))]">線材庫</h2>
                            <p className="text-gray-500 text-sm">先把常用線材建立起來，專案就能一鍵帶入。</p>
                        </div>
                        <button onClick={startAdd} className="px-4 py-2 rounded-xl bg-brand-800 text-white font-bold active:scale-95">＋新增</button>
                    </div>

                    {yarnLibrary.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 border border-brand-100 text-center text-gray-500">
                            還沒有線材紀錄～先新增一捲，讓專案不再「線」路不明。
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {yarnLibrary.map(y => (
                                <div key={y.id} className="bg-white rounded-3xl p-4 border border-brand-100 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-bold text-[rgb(var(--brand-text))] truncate">
                                                {y.brand || '（未填品牌）'} {y.line ? `· ${y.line}` : ''}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {y.weight ? `粗細：${y.weight}` : '粗細：—'}{y.fiber ? ` · 纖維：${y.fiber}` : ''}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {y.colorName || y.colorCode ? `色：${y.colorName || ''}${y.colorCode ? `（${y.colorCode}）` : ''}` : '色：—'}
                                            </div>
                                            {y.notes ? <div className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">{y.notes}</div> : null}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => startEdit(y)} className="px-3 py-2 rounded-xl bg-brand-100 text-[rgb(var(--brand-text))] font-bold">編輯</button>
                                            <button onClick={() => onDeleteYarn(y.id)} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold">刪除</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {open && (
                        <div className="fixed inset-0 z-50 modal-overlay flex items-end md:items-center justify-center p-4">
                            <div className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-3xl shadow-xl border border-brand-100 overflow-hidden">
                                <div className="p-4 border-b border-brand-100 flex items-center justify-between">
                                    <h3 className="font-bold text-[rgb(var(--brand-text))]">{editing ? '編輯線材' : '新增線材'}</h3>
                                    <button onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">✕</button>
                                </div>

                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500">品牌</label>
                                        <input value={form.brand} onChange={(e) => setForm(f => ({...f, brand: e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">系列/品名</label>
                                        <input value={form.line} onChange={(e) => setForm(f => ({...f, line: e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">粗細（如：DK / Worsted / 4 ply）</label>
                                        <input value={form.weight} onChange={(e) => setForm(f => ({...f, weight: e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">纖維（如：羊毛/棉/混紡）</label>
                                        <input value={form.fiber} onChange={(e) => setForm(f => ({...f, fiber: e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">色名</label>
                                        <input value={form.colorName} onChange={(e) => setForm(f => ({...f, colorName: e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">色號</label>
                                        <input value={form.colorCode} onChange={(e) => setForm(f => ({...f, colorCode: e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-gray-500">備註</label>
                                        <textarea value={form.notes} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm h-24" />
                                    </div>
                                </div>

                                <div className="p-4 border-t border-brand-100 flex gap-2">
                                    <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold">取消</button>
                                    <button onClick={save} className="flex-1 py-3 rounded-xl bg-brand-800 text-white font-bold">儲存</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

// --- 3. 頁面元件：專案管理 (Player) ---
        const ProjectView = ({ activeProjects, savedPatterns, yarnLibrary, onDeleteProject, onUpdateProject, onNavigateToLibrary }) => {
            if (activeProjects.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in pb-20">
                        <div className="bg-white p-8 rounded-full mb-6 shadow-sm border border-brand-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d9b98a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-[rgb(var(--brand-text))] mb-2">還沒有編織專案</h2>
                        <p className="text-gray-500 max-w-xs mb-8">挑選一份織圖，泡杯熱茶，開始您的編織時光吧！</p>
                        <button onClick={onNavigateToLibrary} className="px-8 py-3 bg-wool-600 text-white rounded-2xl shadow-lg shadow-brand-200 hover:bg-wool-500 font-bold tracking-wide transform transition active:scale-95">
                            去挑選織圖
                        </button>
                    </div>
                );
            }

            const [selectedProjectId, setSelectedProjectId] = useState(null);
            const currentProject = activeProjects.find(p => p.id === selectedProjectId);
            const currentPattern = currentProject ? savedPatterns.find(p => p.id === currentProject.patternId) : null;

            const activeRowRules = useMemo(() => {
                if (!currentProject || !currentPattern || currentPattern.type !== 'CHART') return [];
                const section = (currentPattern.sections || [])[0];
                if (!section) return [];
                const local = ((currentProject.currentRow - 1) % (section.rows || 1)) + 1;
                const rules = section.rowRules || [];
                return rules.filter(r => parseRowSpec(r.rows, section.rows).includes(local));
            }, [currentProject?.currentRow, currentPattern]);

            const activeAlert = useMemo(() => {
                if (!currentProject || !currentPattern || !currentPattern.alerts) return null;
                return currentPattern.alerts.find(a => a.row === currentProject.currentRow);
            }, [currentProject?.currentRow, currentPattern]);

            // 詳細播放器模式 (Player Mode)
            if (selectedProjectId && currentProject && currentPattern) {
                const [batchN, setBatchN] = useState('');

                const updateRow = (delta) => {
                    const newRow = Math.max(1, currentProject.currentRow + delta);
                    onUpdateProject({ 
                        ...currentProject, 
                        currentRow: newRow, 
                        lastActive: new Date().toISOString() 
                    });
                };

                // Chart Logic
                let displaySection = null;
                let displayRowIndex = -1;
                if (currentPattern.type === 'CHART' && currentPattern.sections.length > 0) {
                    displaySection = currentPattern.sections[0];
                    const localRow = (currentProject.currentRow - 1) % displaySection.rows; 
                    displayRowIndex = displaySection.rows - 1 - localRow;
                }


                // --- Project Materials (cards) ---
                const materials = currentProject;
                const needles = materials.needles || [];
                const yarnsUsed = materials.yarnsUsed || [];

                const getYarnById = (id) => (yarnLibrary || []).find(y => y.id === id);

                const addNeedle = () => {
                    const size = prompt('針號/尺寸（例如 4.0mm / US6）');
                    if (!size) return;
                    const type = prompt('類型（直針/輪針/鉤針…可留空）') || '';
                    onUpdateProject({ ...currentProject, needles: [...needles, { id: crypto.randomUUID(), size, type }], lastActive: new Date().toISOString() });
                };

                const addYarnFromLibrary = () => {
                    if (!yarnLibrary || yarnLibrary.length === 0) {
                        alert('線材庫還沒有資料～先到「線材」頁新增一捲吧！');
                        return;
                    }
                    const options = yarnLibrary.map((y, idx) => `${idx+1}. ${y.brand || ''} ${y.line || ''} ${y.colorName || ''}${y.colorCode ? `(${y.colorCode})` : ''}`).join('\\n');
                    const pick = prompt('輸入要加入的線材編號：\\n' + options);
                    const n = Number(pick);
                    if (!n || n < 1 || n > yarnLibrary.length) return;
                    const y = yarnLibrary[n-1];
                    const batchNote = prompt('這次專案的備註（例如：2顆、改染…可留空）') || '';
                    onUpdateProject({ ...currentProject, yarnsUsed: [...yarnsUsed, { id: crypto.randomUUID(), yarnId: y.id, note: batchNote }], lastActive: new Date().toISOString() });
                };

                const addCustomYarn = () => {
                    const brand = prompt('品牌（可留空）') || '';
                    const weight = prompt('粗細（如 DK / 4ply）') || '';
                    const colorCode = prompt('色號（可留空）') || '';
                    onUpdateProject({ ...currentProject, yarnsUsed: [...yarnsUsed, { id: crypto.randomUUID(), brand, weight, colorCode }], lastActive: new Date().toISOString() });
                };

                const removeNeedle = (id) => onUpdateProject({ ...currentProject, needles: needles.filter(n => n.id !== id), lastActive: new Date().toISOString() });
                const removeYarn = (id) => onUpdateProject({ ...currentProject, yarnsUsed: yarnsUsed.filter(y => y.id !== id), lastActive: new Date().toISOString() });

                                // Text Pattern Sections
                const textSections = currentPattern.textSections || [];

                return (
                    <div className="flex flex-col h-full animate-fade-in bg-white md:bg-transparent pb-20 md:pb-0">
                        {/* Mobile Header */}
                        <div className="bg-white/90 backdrop-blur p-4 shadow-sm flex items-center justify-between sticky top-0 z-30">
                            <button onClick={() => setSelectedProjectId(null)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                            <div className="text-center">
                                <h2 className="font-bold text-[rgb(var(--brand-text))] text-lg">{currentProject.patternName}</h2>
                            </div>
                            <div className="w-8"></div>
                        </div>

                        {/* Info Bar for Text Pattern (Fixed Info) */}
                        {currentPattern.type === 'TEXT' && currentPattern.meta && (
                            <div className="bg-wool-50 px-6 py-3 border-b border-brand-100 flex gap-6 text-sm overflow-x-auto">
                                {currentPattern.meta.castOn && (
                                    <div className="flex flex-col flex-shrink-0">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">起針 Cast On</span>
                                        <span className="font-bold text-[rgb(var(--brand-text))]">{currentPattern.meta.castOn} 針</span>
                                    </div>
                                )}
                                {currentPattern.meta.needle && (
                                    <div className="flex flex-col flex-shrink-0">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">針號 Needle</span>
                                        <span className="font-bold text-[rgb(var(--brand-text))]">{currentPattern.meta.needle}</span>
                                    </div>
                                )}
                                {currentPattern.meta.yarn && (
                                    <div className="flex flex-col flex-shrink-0">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">線材 Yarn</span>
                                        <span className="font-bold text-[rgb(var(--brand-text))]">{currentPattern.meta.yarn}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 flex flex-col md:flex-row gap-6">
                            
                            {/* Counter Section */}
                            <div className="w-full md:w-1/3 flex flex-col gap-4 order-1 md:order-1">
                                <div className="bg-wool-50 rounded-3xl shadow-inner p-6 flex flex-col items-center justify-center border border-brand-100 relative">
                                    {activeAlert && (
                                        <div className="absolute top-4 left-4 right-4 bg-yellow-100 text-yellow-800 text-center py-2 rounded-xl font-bold animate-pulse text-sm shadow-sm border border-yellow-200">
                                            🔔 {activeAlert.message}
                                        </div>
                                    )}

                                    {activeRowRules && activeRowRules.length > 0 && (
                                        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-2xl p-3 border border-brand-100 shadow-sm">
                                            <div className="text-xs font-bold text-[rgb(var(--brand-text))] mb-1">本排規則</div>
                                            <div className="flex flex-wrap gap-2">
                                                {activeRowRules.map(r => (
                                                    <span key={r.id} className="px-3 py-1 rounded-full bg-brand-100 text-[rgb(var(--brand-text))] text-xs font-bold">
                                                        {r.action}{r.note ? `：${r.note}` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="text-wool-400 font-bold uppercase tracking-widest text-xs mb-2 mt-8">目前段數 ROW</h3>
                                    <div className="text-[6rem] md:text-8xl font-black text-[rgb(var(--brand-text))] tabular-nums leading-none mb-8 drop-shadow-sm">
                                        {currentProject.currentRow}
                                    </div>
                                    
                                    {/* Big Control Buttons for Touch */}
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <button onClick={() => updateRow(-1)} className="py-6 bg-white rounded-2xl text-gray-400 shadow-sm border border-gray-100 active:bg-gray-50 active:scale-95 transition-all text-xl font-bold">
                                            -1
                                        </button>
                                        <button onClick={() => updateRow(1)} className="py-6 bg-wool-600 text-white rounded-2xl shadow-lg shadow-brand-200 active:bg-brand-700 active:scale-95 transition-all text-3xl font-bold">
                                            +1
                                        </button>
                                    </div>

                                    {/* Batch update */}
                                    <div className="mt-4 w-full bg-brand-50 border border-brand-100 rounded-2xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold text-[rgb(var(--brand-text))]">快速加排</div>
                                            {(() => {
                                                if (!displaySection) return <div className="text-xs text-gray-500">（文字專案無段排資訊）</div>;
                                                const total = (displaySection.rows || 0) * (displaySection.repeats || 1);
                                                const local = ((currentProject.currentRow - 1) % (displaySection.rows || 1)) + 1;
                                                const rep = Math.floor((currentProject.currentRow - 1) / (displaySection.rows || 1)) + 1;
                                                return <div className="text-xs text-gray-500">總排數 {total} · 目前段排 {local}（第 {rep} 輪）</div>;
                                            })()}
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <input type="number" min="1" placeholder="+n" value={batchN} onChange={(e) => setBatchN(e.target.value)}
                                                className="w-24 border border-gray-200 rounded-xl p-2 text-sm text-center" />
                                            <button onClick={() => { const n = Number(batchN); if (!n) return; updateRow(n); setBatchN(''); }}
                                                className="flex-1 py-2 rounded-xl bg-brand-800 text-white font-bold active:scale-95">套用</button>
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-4 mt-4 w-full">
                                        <button onClick={() => updateRow(-5)} className="px-4 py-2 text-xs text-gray-400 bg-white rounded-lg border border-gray-100">-5</button>
                                        <button onClick={() => updateRow(5)} className="px-4 py-2 text-xs text-wool-600 bg-white rounded-lg border border-brand-100">+5</button>
                                    </div>
                                </div>
                            </div>

                            {/* Pattern Display Section */}
                            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-brand-100 p-6 overflow-hidden flex flex-col order-2 md:order-2 min-h-[300px]">
                                <h4 className="font-bold text-[rgb(var(--brand-text))] mb-4 flex items-center">
                                    <span className="w-2 h-6 bg-wool-400 rounded-full mr-2"></span>
                                    織圖內容
                                </h4>
                                <div className="flex-1 overflow-auto bg-gray-50 rounded-xl p-4 shadow-inner relative">
                                    {currentPattern.type === 'TEXT' ? (
                                        <div className="space-y-6">
                                            {/* Legacy Support */}
                                            {(!textSections || textSections.length === 0) && currentPattern.textContent && (
                                                 <div className="whitespace-pre-wrap font-mono text-gray-700 text-base leading-relaxed">
                                                    {currentPattern.textContent}
                                                </div>
                                            )}

                                    {activeRowRules && activeRowRules.length > 0 && (
                                        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-2xl p-3 border border-brand-100 shadow-sm">
                                            <div className="text-xs font-bold text-[rgb(var(--brand-text))] mb-1">本排規則</div>
                                            <div className="flex flex-wrap gap-2">
                                                {activeRowRules.map(r => (
                                                    <span key={r.id} className="px-3 py-1 rounded-full bg-brand-100 text-[rgb(var(--brand-text))] text-xs font-bold">
                                                        {r.action}{r.note ? `：${r.note}` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                            {/* Sections Display */}
                                            {textSections.map((section, idx) => (
                                                <div key={section.id || idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                    <h5 className="font-bold text-wool-700 border-b border-gray-100 pb-2 mb-2">{section.title}</h5>
                                                    <div className="whitespace-pre-wrap font-mono text-gray-700 text-base leading-relaxed">
                                                        {section.content || <span className="text-gray-400 italic">無內容</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        displaySection && (
                                            <div className="flex flex-col items-center min-w-max">
                                                <div className="inline-block relative bg-white border-2 border-brand-200 rounded p-1 shadow-sm">
                                                    <div 
                                                        className="grid gap-[1px] bg-wool-200 border border-brand-200"
                                                        style={{
                                                            gridTemplateColumns: `repeat(${displaySection.cols}, 28px)`,
                                                            gridTemplateRows: `repeat(${displaySection.rows}, 28px)`
                                                        }}
                                                    >
                                                        {displaySection.grid.map((row, rIndex) => (
                                                            row.map((cellType, cIndex) => (
                                                                <div
                                                                    key={`${rIndex}-${cIndex}`}
                                                                    className={`
                                                                        flex items-center justify-center text-xs font-mono select-none
                                                                        ${SYMBOLS[cellType]?.color || 'bg-white'}
                                                                        ${rIndex === displayRowIndex ? 'ring-2 ring-wool-600 z-10 font-bold' : 'opacity-60 grayscale-[0.5]'}
                                                                    `}
                                                                >
                                                                    {SYMBOLS[cellType]?.symbol}
                                                                </div>
                                                            ))
                                                        ))}
                                                    </div>
                                                    {/* Highlight Bar */}
                                                    <div 
                                                        className="absolute left-0 right-0 border-2 border-wool-600 rounded pointer-events-none shadow-[0_0_15px_rgba(191,134,82,0.3)]"
                                                        style={{
                                                            top: `${displayRowIndex * 29}px`, // 28px + gap
                                                            height: '30px',
                                                            display: displayRowIndex >= 0 ? 'block' : 'none'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            // --- 列表模式 (List View) ---
            return (
                <div className="max-w-5xl mx-auto p-4 animate-fade-in pb-24 md:pb-8">
                    <h2 className="text-2xl font-bold text-[rgb(var(--brand-text))] mb-6 pl-2">進行中的專案</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeProjects.map(proj => {
                            const ptn = savedPatterns.find(p => p.id === proj.patternId);
                            return (
                                <div key={proj.id} onClick={() => setSelectedProjectId(proj.id)} className="bg-white rounded-3xl shadow-sm border border-wool-50 p-5 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-wool-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                                    <div className="relative z-10 flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-sm ${ptn?.type === 'CHART' ? 'bg-indigo-50 text-indigo-400' : 'bg-green-50 text-green-500'}`}>
                                                {ptn?.type === 'CHART' ? 
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> : 
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                }
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-700 truncate max-w-[150px]">{proj.patternName}</h3>
                                                <p className="text-xs text-gray-400">{new Date(proj.lastActive).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }} className="text-gray-300 hover:text-red-400 p-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                    <div className="bg-wool-50 rounded-2xl p-4 flex justify-between items-end relative z-10">
                                        <span className="text-xs text-wool-400 font-bold uppercase tracking-wider mb-1">Row</span>
                                        <span className="text-3xl font-black text-wool-600">{proj.currentRow}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        // --- 4. 頁面元件：圖庫 (Library) ---
        const LibraryView = ({ savedPatterns, onSelectPattern, onDeletePattern, onImport, onNewPattern, onCreateProject }) => {
            const [filter, setFilter] = useState('ALL');
            const fileInputRef = useRef(null);
            
            const handleNew = (type) => onNewPattern(type);
            const filtered = savedPatterns.filter(p => filter === 'ALL' ? true : p.category === filter);
            const handleFileChange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => { try { const json = JSON.parse(event.target.result); onImport(json); } catch (err) { alert("格式錯誤"); } };
                reader.readAsText(file);
                e.target.value = null;
            };

            return (
                <div className="max-w-6xl mx-auto p-4 animate-fade-in pb-24 md:pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="pl-2">
                            <h2 className="text-2xl font-bold text-[rgb(var(--brand-text))]">織圖資料庫</h2>
                            <p className="text-sm text-gray-500">所有的織圖與文字說明</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
                            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                            <button onClick={() => fileInputRef.current.click()} className="flex-shrink-0 flex items-center px-4 py-2 bg-white border border-brand-200 rounded-xl text-wool-700 hover:bg-wool-50 text-sm font-bold shadow-sm">
                                匯入
                            </button>
                            
                            <div className="flex gap-2">
                                <button onClick={() => handleNew('CHART')} className="flex-shrink-0 flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm text-sm font-bold border border-indigo-100">
                                    + 格子
                                </button>
                                <button onClick={() => handleNew('TEXT')} className="flex-shrink-0 flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-xl shadow-sm text-sm font-bold border border-green-100">
                                    + 文字
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <button onClick={() => setFilter('ALL')} className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === 'ALL' ? 'bg-brand-800 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>全部</button>
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setFilter(cat)} className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === cat ? 'bg-brand-800 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>{cat}</button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(pattern => (
                            <div key={pattern.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col relative overflow-hidden active:scale-[0.99] transition-transform">
                                <div onClick={() => onSelectPattern(pattern)} className="cursor-pointer flex-1 relative z-10">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${pattern.type === 'TEXT' ? 'bg-green-50 text-green-500' : 'bg-indigo-50 text-indigo-400'}`}>
                                            {pattern.type === 'TEXT' ? 
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> : 
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                                            }
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); onDeletePattern(pattern.id); }} className="text-gray-300 hover:text-red-400 p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg truncate mb-1">{pattern.name}</h3>
                                    <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-lg">{pattern.category}</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 relative z-10">
                                    <button onClick={() => onCreateProject(pattern)} className="w-full py-3 bg-brand-100 text-[rgb(var(--brand-text))] rounded-xl hover:bg-wool-200 text-sm font-bold flex items-center justify-center transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                        開始編織
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        const EditorView = ({ pattern, onUpdate, onBack }) => {
            const [data, setData] = useState(pattern);
            const [activeTab, setActiveTab] = useState('CONTENT'); 
            const [selectedTool, setSelectedTool] = useState('KNIT');

            // Initialize new structure for legacy patterns
            useEffect(() => {
                let updated = false;
                const newData = { ...data };
                if (data.type === 'TEXT') {
                    if (!data.meta) { newData.meta = { castOn: '', needle: '', yarn: '' }; updated = true; }
                    if (!data.textSections) { 
                        newData.textSections = data.textContent ? [{id: crypto.randomUUID(), title: '說明', content: data.textContent}] : [{id: crypto.randomUUID(), title: '區段 1', content: ''}];
                        updated = true;
                    }
                }
                if (updated) {
                    setData(newData);
                    // Don't auto-save here to avoid infinite loop or side effects, wait for user action
                }
            }, []);

            useEffect(() => { onUpdate(data); }, [data]);
            const updateMeta = (f, v) => setData(p => ({ ...p, [f]: v, updatedAt: new Date().toISOString() }));
            const updateTextMeta = (f, v) => setData(p => ({ ...p, meta: { ...(p.meta || {}), [f]: v }, updatedAt: new Date().toISOString() }));

            // Alert Logic
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

            // Text Section Logic
            const addTextSection = () => setData(p => ({ ...p, textSections: [...(p.textSections || []), { id: crypto.randomUUID(), title: '新區段', content: '' }] }));
            const updateTextSection = (idx, f, v) => {
                const newSections = [...(data.textSections || [])];
                newSections[idx] = { ...newSections[idx], [f]: v };
                setData(p => ({ ...p, textSections: newSections }));
            };
            const removeTextSection = (idx) => {
                if(confirm('刪除此區段？')) {
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

            // Chart Cell Logic
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
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-30">
                        <button onClick={onBack} className="p-2 -ml-2 text-gray-500">← 返回</button>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setActiveTab('CONTENT')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'CONTENT' ? 'bg-white shadow text-[rgb(var(--brand-text))]' : 'text-gray-400'}`}>內容</button>
                            <button onClick={() => setActiveTab('ALERTS')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'ALERTS' ? 'bg-white shadow text-yellow-600' : 'text-gray-400'}`}>提醒</button>
                        </div>
                        <div className="w-8"></div>
                    </div>

                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <input type="text" value={data.name} onChange={(e) => updateMeta('name', e.target.value)} className="w-full font-bold text-lg text-[rgb(var(--brand-text))] bg-transparent border-none p-0 focus:ring-0 mb-2" placeholder="專案名稱" />
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
                                        <input type="number" value={alert.row} onChange={(e) => updateAlert(idx, 'row', parseInt(e.target.value))} className="w-12 border border-gray-200 rounded text-center py-1" />
                                        <span className="text-sm text-gray-500 whitespace-nowrap">段：</span>
                                        <input type="text" value={alert.message} onChange={(e) => updateAlert(idx, 'message', e.target.value)} className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm" placeholder="提醒內容" />
                                        <button onClick={() => removeAlert(idx)} className="text-red-300 p-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </div>
                                ))}
                            </div>
                        ) : data.type === 'TEXT' ? (
                            <div className="space-y-6">
                                {/* Fixed Info Fields */}
                                <div className="bg-wool-50 p-4 rounded-xl border border-brand-100">
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

                                {/* Text Sections */}
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
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                </button>
                                            </div>
                                            <div className="p-2 bg-white">
                                                {/* Quick Insert Tags */}
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
                                                ></textarea>
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
                                {/* Tool Palette - Horizontal Scroll */}
                                <div className="bg-white border-b border-gray-100 py-2 flex overflow-x-auto gap-2 items-center sticky top-0 z-10 -mx-4 px-4 shadow-sm">
                                    {Object.values(SYMBOLS).map((tool) => (
                                        <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className={`flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-lg border transition-all ${selectedTool === tool.id ? 'bg-brand-800 text-white shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100'}`}>
                                            <span className="text-sm font-mono">{tool.symbol}</span>
                                        </button>
                                    ))}
                                </div>
                                {data.sections.map(section => (
                                    <React.Fragment key={section.id}>
                                    <div key={section.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 overflow-hidden">
                                        <h4 className="font-bold mb-2 text-wool-700">{section.name}</h4>
                                        <div className="overflow-x-auto pb-2">
                                            <div className="grid gap-[1px] bg-gray-300 border border-gray-300 inline-block rounded overflow-hidden" style={{ gridTemplateColumns: `repeat(${section.cols}, 26px)` }}>
                                                {section.grid.map((row, r) => row.map((cell, c) => (
                                                    <div key={`${r}-${c}`} onClick={() => handleCellClick(section.id, r, c)} className={`h-[26px] w-[26px] bg-white flex items-center justify-center text-xs cursor-pointer hover:bg-blue-50`}>{SYMBOLS[cell]?.symbol}</div>
                                                )))}
                                            </div>
                                        </div>
                                    

                                        <div className="mt-3 bg-white rounded-2xl border border-brand-100 p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs font-bold text-gray-600">段內規則（這段哪些排要做什麼）</div>
                                                <button
                                                    onClick={() => {
                                                        const newRule = { id: crypto.randomUUID(), rows: 'every 4', action: '加針', note: '' };
                                                        const newSections = data.sections.map(s => s.id === section.id ? ({ ...s, rowRules: [...(s.rowRules || []), newRule] }) : s);
                                                        setData(p => ({ ...p, sections: newSections }));
                                                    }}
                                                    className="px-3 py-2 rounded-xl bg-brand-100 text-[rgb(var(--brand-text))] font-bold text-xs"
                                                >
                                                    ＋新增規則
                                                </button>
                                            </div>

                                            {(section.rowRules || []).length === 0 ? (
                                                <div className="text-xs text-gray-400 mt-2">尚未設定。例：every 4、1,3,5、5-12</div>
                                            ) : (
                                                <div className="mt-2 space-y-2">
                                                    {(section.rowRules || []).map((rule) => (
                                                        <div key={rule.id} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center bg-brand-50 border border-brand-100 rounded-2xl p-2">
                                                            <div className="md:col-span-2">
                                                                <div className="text-[10px] text-gray-500">排數</div>
                                                                <input
                                                                    value={rule.rows || ''}
                                                                    onChange={(e) => {
                                                                        const newSections = data.sections.map(s => s.id === section.id
                                                                            ? ({ ...s, rowRules: (s.rowRules || []).map(r => r.id === rule.id ? ({ ...r, rows: e.target.value }) : r) })
                                                                            : s
                                                                        );
                                                                        setData(p => ({ ...p, sections: newSections }));
                                                                    }}
                                                                    className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm"
                                                                    placeholder="例如：every 4 / 1,3,5 / 5-12"
                                                                />
                                                            </div>

                                                            <div className="md:col-span-2">
                                                                <div className="text-[10px] text-gray-500">動作</div>
                                                                <select
                                                                    value={rule.action || '加針'}
                                                                    onChange={(e) => {
                                                                        const newSections = data.sections.map(s => s.id === section.id
                                                                            ? ({ ...s, rowRules: (s.rowRules || []).map(r => r.id === rule.id ? ({ ...r, action: e.target.value }) : r) })
                                                                            : s
                                                                        );
                                                                        setData(p => ({ ...p, sections: newSections }));
                                                                    }}
                                                                    className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm bg-white"
                                                                >
                                                                    <option value="加針">加針</option>
                                                                    <option value="減針">減針</option>
                                                                    <option value="扭麻花">扭麻花</option>
                                                                    <option value="換色">換色</option>
                                                                    <option value="其他">其他</option>
                                                                </select>
                                                            </div>

                                                            <div className="md:col-span-2">
                                                                <div className="text-[10px] text-gray-500">備註</div>
                                                                <input
                                                                    value={rule.note || ''}
                                                                    onChange={(e) => {
                                                                        const newSections = data.sections.map(s => s.id === section.id
                                                                            ? ({ ...s, rowRules: (s.rowRules || []).map(r => r.id === rule.id ? ({ ...r, note: e.target.value }) : r) })
                                                                            : s
                                                                        );
                                                                        setData(p => ({ ...p, sections: newSections }));
                                                                    }}
                                                                    className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm"
                                                                    placeholder="例如：左右各+1 / C4B"
                                                                />
                                                            </div>

                                                            <div className="md:col-span-1 flex justify-end">
                                                                <button
                                                                    onClick={() => {
                                                                        const newSections = data.sections.map(s => s.id === section.id
                                                                            ? ({ ...s, rowRules: (s.rowRules || []).filter(r => r.id !== rule.id) })
                                                                            : s
                                                                        );
                                                                        setData(p => ({ ...p, sections: newSections }));
                                                                    }}
                                                                    className="px-3 py-2 rounded-xl bg-white border border-brand-100 text-gray-500 font-bold text-xs hover:bg-gray-50"
                                                                >
                                                                    刪除
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                
                                    </React.Fragment>
))}
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        // --- 5. 主程式 ---
        const App = () => {

            const [cloudOpen, setCloudOpen] = useState(false);
            const [cloudStatus, setCloudStatus] = useState('');

            const THEME_KEY = 'cozy_knit_theme_v1';
            const THEMES = [
                { id: 'blue', name: '莫蘭迪藍', cls: 'theme-blue' },
                { id: 'purple', name: '莫蘭迪紫', cls: 'theme-purple' },
                { id: 'green', name: '墨綠', cls: 'theme-green' },
                { id: 'mono', name: '黑白灰', cls: 'theme-mono' },
            ];
            const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_KEY) || 'blue');

            useEffect(() => {
                const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
                const root = document.documentElement;
                // remove previous theme classes
                root.classList.remove('theme-blue','theme-purple','theme-green','theme-mono');
                root.classList.add(theme.cls);
                localStorage.setItem(THEME_KEY, themeId);
            }, [themeId]);

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
                    setCloudStatus(`載入成功 ✅（sha: ${String(sha).slice(0,7)}…）`);
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
                    await window.CozyKnitStorage.saveData(cfg, payload, cloudShaRef.current);
                    // refresh sha after save
                    await loadFromCloud();
                    setCloudStatus('已存到 GitHub ✅');
                } catch (e) {
                    console.error(e);
                    setCloudStatus('存檔失敗：' + (e?.message || String(e)) + '\n若你同時開了兩個分頁，請重新載入後再存。');
                }
            };
            const [view, setView] = useState('PROJECTS');
            const [savedPatterns, setSavedPatterns] = useState([]);
            const [activeProjects, setActiveProjects] = useState([]);
            const [yarnLibrary, setYarnLibrary] = useState([]);
            const [currentPattern, setCurrentPattern] = useState(null);

            useEffect(() => {
                // 1) Local cache first (fast)
                const cache = localStorage.getItem(CLOUD_CACHE_KEY);
                if (cache) {
                    try {
                        const d = JSON.parse(cache);
                        if (Array.isArray(d.savedPatterns)) setSavedPatterns(d.savedPatterns);
                        if (Array.isArray(d.activeProjects)) setActiveProjects(d.activeProjects);
                        if (Array.isArray(d.yarnLibrary)) setYarnLibrary(d.yarnLibrary);
                    } catch(e) {}
                } else {
                    const savedP = localStorage.getItem('cozy_knit_patterns_v6');
                    const savedProj = localStorage.getItem('cozy_knit_projects_v6');
                    if (savedP) try { setSavedPatterns(JSON.parse(savedP)); } catch(e) {}
                    if (savedProj) try { setActiveProjects(JSON.parse(savedProj)); } catch(e) {}
                    const savedY = localStorage.getItem('cozy_knit_yarns_v1');
                    if (savedY) try { setYarnLibrary(JSON.parse(savedY)); } catch(e) {}
                }

                // 2) Cloud auto-load if config exists
                const c = readCloudCfg();
                if (c?.owner && c?.repo && c?.token) {
                    setCloudCfg({
                        owner: c.owner,
                        repo: c.repo || 'KnittingLog-Data',
                        branch: c.branch || 'main',
                        path: c.path || 'data/knitting.json',
                        token: c.token
                    });
                    setTimeout(() => { loadFromCloud(); }, 50);
                }
            }, []);

            useEffect(() => {
                localStorage.setItem('cozy_knit_patterns_v6', JSON.stringify(savedPatterns));
                try {
                    const cur = JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY) || '{}');
                    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify({ ...cur, version: 1, updatedAt: new Date().toISOString(), savedPatterns }));
                } catch(e) {}
            }, [savedPatterns]);
            useEffect(() => {
                localStorage.setItem('cozy_knit_projects_v6', JSON.stringify(activeProjects));
                try {
                    const cur = JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY) || '{}');
                    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify({ ...cur, version: 1, updatedAt: new Date().toISOString(), activeProjects }));
                } catch(e) {}
            }, [activeProjects]);

            useEffect(() => {
                localStorage.setItem('cozy_knit_yarns_v1', JSON.stringify(yarnLibrary));
                try {
                    const cur = JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY) || '{}');
                    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify({ ...cur, version: 1, updatedAt: new Date().toISOString(), yarnLibrary }));
                } catch(e) {}
            }, [yarnLibrary]);

            const handleNewPattern = (type) => { setCurrentPattern(createNewPattern(type)); setView('EDITOR'); };
            const handleSelectPattern = (p) => { setCurrentPattern({...p}); setView('EDITOR'); };
            const handleDeletePattern = (id) => { if(confirm('刪除織圖？')) setSavedPatterns(p => p.filter(x => x.id !== id)); };
            const handleSavePattern = (p) => {
                setCurrentPattern(p);
                setSavedPatterns(prev => {
                    const idx = prev.findIndex(x => x.id === p.id);
                    return idx >= 0 ? prev.map((item, i) => i === idx ? p : item) : [p, ...prev];
                });
            };
            const handleImport = (json) => setSavedPatterns(p => [{...json, id: crypto.randomUUID(), name: json.name + '(匯入)'}, ...p]);
            const handleCreateProject = (pattern) => {
                const newProject = createProject(pattern.id, pattern.name);
                setActiveProjects(prev => [newProject, ...prev]);
                setView('PROJECTS');
            };
            const handleUpdateProject = (updatedProj) => { setActiveProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p)); };
            const handleDeleteProject = (id) => { if(confirm('結束專案？')) setActiveProjects(p => p.filter(x => x.id !== id)); };

            // Navigation Components
            const NavIcon = ({ icon, label, active, onClick }) => (
                <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 transition-all duration-300 ${active ? 'text-[rgb(var(--brand-text))] scale-105' : 'text-gray-400 hover:text-gray-500'}`}>
                    {icon}
                    <span className={`text-[10px] mt-1 font-bold ${active ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>{label}</span>
                </button>
            );

            return (
                <div className="flex h-screen overflow-hidden">
                    {/* Desktop Sidebar */}
                    <div className="hidden md:flex w-24 bg-white border-r border-brand-100 flex-col items-center py-8 space-y-8 z-30 shadow-sm relative">
                        <div className="w-12 h-12 bg-brand-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.2 16.6l-5.6-3.2 5.6-3.2c.8-.5.8-1.9-.3-2.3L15.3 5.4c-.9-.4-2-.2-2.5.5L7.9 14.5c-.5.8-1.7.8-2.2-.1L3.3 12c-.5-.9.1-1.9 1.1-1.9H12"/><path d="M12 22V12"/></svg>
                        </div>
                        <nav className="flex flex-col space-y-6 w-full items-center">
                            <NavIcon active={view === 'PROJECTS'} onClick={() => setView('PROJECTS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>} label="專案" />
                            <NavIcon active={view === 'YARNS'} onClick={() => setView('YARNS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a7 7 0 0 0-7 7c0 2.2 1 4.1 2.6 5.4"/><path d="M12 3a7 7 0 0 1 7 7c0 2.2-1 4.1-2.6 5.4"/><path d="M8 14c1.2 1 2.6 1.6 4 1.6s2.8-.6 4-1.6"/><path d="M7 17h10"/><path d="M9 21h6"/></svg>} label="線材" />
                            <NavIcon active={view === 'LIBRARY' || view === 'EDITOR'} onClick={() => setView('LIBRARY')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>} label="圖庫" />
                            <NavIcon active={view === 'TUTORIAL'} onClick={() => setView('TUTORIAL')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>} label="教學" />
                        </nav>
                        <button onClick={() => setCloudOpen(true)} className="mt-auto mb-2 text-xs font-bold text-gray-400 hover:text-wool-700">🎨 換主題</button>
                        <button onClick={() => setThemeId(prev => {
                            const i = THEMES.findIndex(t => t.id === prev);
                            return THEMES[(i+1)%THEMES.length].id;
                        })} className="mt-auto -mb-1 text-xs font-bold text-gray-400 hover:text-[rgb(var(--brand-text))]">🎨 換主題</button>
                        <button onClick={() => setCloudOpen(true)} className="mb-2 text-xs font-bold text-gray-400 hover:text-[rgb(var(--brand-text))]">⚙︎ 雲端同步</button>
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative pb-safe">
                         {/* Mobile Top Bar (Only visible on main views) */}
                         <div className="md:hidden p-4 flex items-center justify-between bg-white/50 backdrop-blur sticky top-0 z-20">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-brand-800 text-white rounded-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.2 16.6l-5.6-3.2 5.6-3.2c.8-.5.8-1.9-.3-2.3L15.3 5.4c-.9-.4-2-.2-2.5.5L7.9 14.5c-.5.8-1.7.8-2.2-.1L3.3 12c-.5-.9.1-1.9 1.1-1.9H12"/><path d="M12 22V12"/></svg>
                                </div>
                                <span className="font-bold text-[rgb(var(--brand-text))] text-lg">Cozy Knit</span>
                             </div>
                             <button onClick={() => setCloudOpen(true)} className="px-3 py-2 bg-white border border-brand-100 rounded-xl text-xs font-bold text-wool-700 shadow-sm">同步</button>
                         </div>

                        <div className="flex-1 overflow-y-auto">
                            {view === 'TUTORIAL' && <TutorialView />}
                            {view === 'PROJECTS' && <ProjectView activeProjects={activeProjects} savedPatterns={savedPatterns} onDeleteProject={handleDeleteProject} onUpdateProject={handleUpdateProject} onNavigateToLibrary={() => setView('LIBRARY')} yarnLibrary={yarnLibrary} onUpdateYarnLibrary={setYarnLibrary} />}
{view === 'YARNS' && <YarnLibraryView yarnLibrary={yarnLibrary} onAddYarn={(y) => setYarnLibrary(prev => [y, ...(prev || [])])} onUpdateYarn={(y) => setYarnLibrary(prev => (prev || []).map(i => i.id === y.id ? y : i))} onDeleteYarn={(id) => setYarnLibrary(prev => (prev || []).filter(i => i.id !== id))} />}
                            {view === 'LIBRARY' && <LibraryView savedPatterns={savedPatterns} onSelectPattern={handleSelectPattern} onDeletePattern={handleDeletePattern} onImport={handleImport} onNewPattern={handleNewPattern} onCreateProject={handleCreateProject} />}
                            {view === 'EDITOR' && currentPattern && <EditorView pattern={currentPattern} onUpdate={handleSavePattern} onBack={() => setView('LIBRARY')} />}
                        </div>
                    </div>

                    
                    <SettingsModal
                        open={cloudOpen}
                        onClose={() => setCloudOpen(false)}
                        cfg={cloudCfg}
                        setCfg={setCloudCfg}
                        status={cloudStatus}
                        onLoad={loadFromCloud}
                        onSave={saveToCloud}
                    />

{/* Mobile Bottom Navigation (Hidden on Desktop) */}
                    {view !== 'EDITOR' && (
                        <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-brand-100 flex justify-around py-3 pb-safe z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                            <NavIcon active={view === 'PROJECTS'} onClick={() => setView('PROJECTS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>} label="專案" />
                            <NavIcon active={view === 'YARNS'} onClick={() => setView('YARNS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a7 7 0 0 0-7 7c0 2.2 1 4.1 2.6 5.4"/><path d="M12 3a7 7 0 0 1 7 7c0 2.2-1 4.1-2.6 5.4"/><path d="M8 14c1.2 1 2.6 1.6 4 1.6s2.8-.6 4-1.6"/><path d="M7 17h10"/><path d="M9 21h6"/></svg>} label="線材" />
                            <NavIcon active={view === 'YARNS'} onClick={() => setView('YARNS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a7 7 0 0 0-7 7c0 2.2 1 4.1 2.6 5.4"/><path d="M12 3a7 7 0 0 1 7 7c0 2.2-1 4.1-2.6 5.4"/><path d="M8 14c1.2 1 2.6 1.6 4 1.6s2.8-.6 4-1.6"/><path d="M7 17h10"/><path d="M9 21h6"/></svg>} label="線材" />
                            <NavIcon active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>} label="圖庫" />
                            <NavIcon active={view === 'TUTORIAL'} onClick={() => setView('TUTORIAL')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>} label="教學" />
                        </div>
                    )}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
