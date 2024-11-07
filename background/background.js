// 后台脚本用于处理可能的长时间运行任务
chrome.runtime.onInstalled.addListener(() => {
  // 检查是否已设置API Key
  chrome.storage.sync.get(['groqApiKey'], (result) => {
    if (!result.groqApiKey) {
      // 如果未设置API Key，打开选项页面
      chrome.runtime.openOptionsPage();
    }
  });
}); 