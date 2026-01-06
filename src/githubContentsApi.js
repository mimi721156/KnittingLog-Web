
const API_BASE = "https://api.github.com";

function b64encodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64decodeUnicode(b64) {
  const bin = atob(b64.replaceAll("\n", ""));
  return decodeURIComponent(escape(bin));
}

export async function getJsonViaContentsApi({ owner, repo, path, branch, token }) {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`讀取失敗：${res.status}\n${text}`);
  }

  const data = await res.json();
  if (!data.content || !data.sha) throw new Error("讀取到的內容不完整（缺 content/sha）");

  const jsonText = b64decodeUnicode(data.content);
  return { json: JSON.parse(jsonText), sha: data.sha };
}

export async function putJsonViaContentsApi({ owner, repo, path, branch, token, jsonObject, sha, message }) {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  const content = b64encodeUnicode(JSON.stringify(jsonObject, null, 2));

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message || `Update ${path}`,
      content,
      sha,
      branch,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // 常見：409/422（sha 不符）表示你開了兩個分頁或別處先存了
    throw new Error(`寫入失敗：${res.status}\n${text}`);
  }

  return await res.json();
}
