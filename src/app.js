import { loadData, saveData } from "./storage.js";

const $ = (sel) => document.querySelector(sel);

const els = {
  owner: $("#owner"),
  dataRepo: $("#dataRepo"),
  branch: $("#branch"),
  path: $("#path"),
  token: $("#token"),
  saveSettings: $("#saveSettings"),
  loadBtn: $("#loadBtn"),
  status: $("#status"),

  date: $("#date"),
  project: $("#project"),
  notes: $("#notes"),
  tags: $("#tags"),
  addEntry: $("#addEntry"),
  saveBtn: $("#saveBtn"),

  exportBtn: $("#exportBtn"),
  list: $("#list"),
};

const SETTINGS_KEY = "knit_cfg_v1";

let state = { version: 1, updatedAt: null, entries: [] };
let currentSha = null;

function setStatus(msg) { els.status.textContent = msg; }

function readCfg() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  const cfg = {
    owner: (els.owner.value || saved.owner || "").trim(),
    repo: (els.dataRepo.value || saved.repo || "KnittingLog-Data").trim(),
    branch: (els.branch.value || saved.branch || "main").trim(),
    path: (els.path.value || saved.path || "data/knitting.json").trim(),
    token: (els.token.value || saved.token || "").trim(),
  };
  return cfg;
}

function writeCfg(cfg) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    owner: cfg.owner, repo: cfg.repo, branch: cfg.branch, path: cfg.path, token: cfg.token
  }));
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function render() {
  const entries = (state.entries || []).slice().sort((a,b) => (b.date||"").localeCompare(a.date||""));
  els.list.innerHTML = entries.map(e => {
    const tags = (e.tags || []).filter(Boolean);
    return `
      <div class="item">
        <div class="top">
          <div><b>${escapeHtml(e.date || "")}</b>　${escapeHtml(e.project || "")}</div>
          <div class="small">${escapeHtml(e.id || "")}</div>
        </div>
        <div style="margin-top:6px;">${escapeHtml(e.notes || "")}</div>
        ${tags.length ? `<div class="badges">${tags.map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
      </div>
    `;
  }).join("");

  setStatus(`目前筆數：${entries.length}${state.updatedAt ? `（上次更新：${state.updatedAt}）` : ""}`);
}

function newId() {
  const d = new Date();
  const ymd = d.toISOString().slice(0,10).replaceAll("-","");
  return `e_${ymd}_${Math.random().toString(16).slice(2,6)}`;
}

async function doLoad() {
  const cfg = readCfg();
  if (!cfg.owner || !cfg.repo || !cfg.token) {
    setStatus("先填 Owner / Token（Token 只需對私有資料 repo 有 Contents 讀寫權限）");
    render();
    return;
  }

  setStatus("載入中…");
  try {
    const { data, sha } = await loadData(cfg);
    state = data;
    currentSha = sha;
    render();
    setStatus(`載入成功 ✅（sha: ${sha.slice(0,7)}…）`);
  } catch (err) {
    console.error(err);
    setStatus("載入失敗： " + err.message);
  }
}

async function doSave() {
  const cfg = readCfg();
  if (!cfg.owner || !cfg.repo || !cfg.token) return alert("請先完成設定並貼上 Token");
  if (!currentSha) return alert("還沒載入資料，先按「重新載入資料」");

  setStatus("存檔中…");
  try {
    await saveData(cfg, state, currentSha);

    // 存完再讀一次拿最新 sha（避免下一次存檔 sha 過期）
    await doLoad();
    alert("已存到 GitHub ✅");
  } catch (err) {
    console.error(err);
    alert("存檔失敗：\n" + err.message + "\n\n若你同時開了兩個分頁，請重新載入後再存。");
    setStatus("存檔失敗： " + err.message);
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `knitting_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function hydrateInputsFromSaved() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  els.owner.value = saved.owner || "";
  els.dataRepo.value = saved.repo || "KnittingLog-Data";
  els.branch.value = saved.branch || "main";
  els.path.value = saved.path || "data/knitting.json";
  els.token.value = saved.token || "";
}

els.saveSettings.addEventListener("click", () => {
  const cfg = readCfg();
  writeCfg(cfg);
  alert("設定已儲存（只存在此瀏覽器）");
});

els.loadBtn.addEventListener("click", doLoad);

els.addEntry.addEventListener("click", () => {
  const date = els.date.value || new Date().toISOString().slice(0,10);
  const project = els.project.value.trim();
  const notes = els.notes.value.trim();
  const tags = els.tags.value.split(",").map(s => s.trim()).filter(Boolean);

  state.entries = state.entries || [];
  state.entries.push({ id: newId(), date, project, notes, tags });

  els.project.value = "";
  els.notes.value = "";
  els.tags.value = "";

  render();
});

els.saveBtn.addEventListener("click", doSave);
els.exportBtn.addEventListener("click", exportJson);

// init
hydrateInputsFromSaved();
render();
doLoad();
