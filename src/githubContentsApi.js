// src/githubContentsApi.js

function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function encodeContent(str) {
  // 兼容 UTF-8
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeContent(base64) {
  const clean = (base64 || '').replace(/\n/g, '');
  if (!clean) return '';
  return decodeURIComponent(escape(atob(clean)));
}

/**
 * 從 GitHub 讀取 JSON 檔
 * @returns {Promise<{data: any, sha: string}>}
 */
export async function loadFromGitHub({ owner, repo, branch, path, token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}?ref=${encodeURIComponent(branch)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`載入失敗：${res.status} ${text}`);
  }

  const json = await res.json();
  const content = decodeContent(json.content);
  const data = content ? JSON.parse(content) : {};

  return { data, sha: json.sha };
}

async function putContent({ owner, repo, branch, path, token, sha, data }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}`;

  const contentString = JSON.stringify(data, null, 2);
  const encoded = encodeContent(contentString);

  const body = {
    message: 'Update knitting data from Cozy Knit',
    content: encoded,
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...buildHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return res;
}

/**
 * 寫入 JSON 到 GitHub
 * - opts.sha：你若已經記住上一個 sha，就不用每次先 GET
 * - 若 sha 過期導致 409/422，會自動 GET 一次最新 sha 再重試 1 次
 * @returns {Promise<{sha: string}>}
 */
export async function saveToGitHub(settings, data, opts = {}) {
  const { owner, repo, branch, path, token } = settings;

  let sha = opts.sha || null;

  // 沒有 sha 才去抓（檔案不存在就算了）
  if (!sha) {
    try {
      const existing = await loadFromGitHub(settings);
      sha = existing.sha;
    } catch (err) {
      // 404 代表不存在：sha = null -> 走新建
    }
  }

  // 第一次 PUT
  let res = await putContent({ owner, repo, branch, path, token, sha, data });

  // sha 過期常見：409/422，補救：再抓一次最新 sha 重試
  if (!res.ok && (res.status === 409 || res.status === 422)) {
    try {
      const existing = await loadFromGitHub(settings);
      sha = existing.sha;
      res = await putContent({ owner, repo, branch, path, token, sha, data });
    } catch (e) {
      // 忽略，交給下面統一 throw
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`儲存失敗：${res.status} ${text}`);
  }

  const json = await res.json();
  return { sha: json.content.sha };
}
