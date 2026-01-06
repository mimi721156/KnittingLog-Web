
import { getJsonViaContentsApi, putJsonViaContentsApi } from "./githubContentsApi.js";

export async function loadData(cfg) {
  const { json, sha } = await getJsonViaContentsApi(cfg);
  return { data: json, sha };
}

export async function saveData(cfg, data, sha) {
  data.updatedAt = new Date().toISOString();
  return await putJsonViaContentsApi({
    ...cfg,
    jsonObject: data,
    sha,
    message: `Update knitting log (${new Date().toISOString()})`,
  });
}
