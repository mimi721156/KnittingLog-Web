(function(){
  const { getJsonViaContentsApi, putJsonViaContentsApi } = window.CozyKnitGitHub;

  function defaultData() {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      savedPatterns: [],
      activeProjects: [],
    };
  }

  async function loadData(cfg) {
    const { json, sha } = await getJsonViaContentsApi(cfg);
    const data = {
      ...defaultData(),
      ...json,
      savedPatterns: Array.isArray(json?.savedPatterns) ? json.savedPatterns : [],
      activeProjects: Array.isArray(json?.activeProjects) ? json.activeProjects : [],
    };
    return { data, sha };
  }

  async function saveData(cfg, data, sha) {
    const payload = { ...data, updatedAt: new Date().toISOString() };
    return await putJsonViaContentsApi({
      ...cfg,
      jsonObject: payload,
      sha,
      message: `Update Cozy Knit data (${new Date().toISOString()})`,
    });
  }

  window.CozyKnitStorage = { defaultData, loadData, saveData };
})();
