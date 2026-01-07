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

/**
 * 寫入 JSON 到 GitHub
 * 會先嘗試拿 sha，若檔案不存在則直接新建
 * @returns {Promise<{sha: string}>}
 */
export async function saveToGitHub(settings, data) {
  const { owner, repo, branch, path, token } = settings;

  // 嘗試先抓 sha（檔案不存在就算了）
  let sha = null;
  try {
    const existing = await loadFromGitHub(settings);
    sha = existing.sha;
  } catch (err) {
    // 404 則代表檔案不存在，略過；其他錯誤就直接丟給 PUT 去報
  }

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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`儲存失敗：${res.status} ${text}`);
  }

  const json = await res.json();
  return { sha: json.content.sha };
}
