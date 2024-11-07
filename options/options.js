document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-btn');
  const status = document.getElementById('status');

  // 加载已保存的API Key
  chrome.storage.sync.get(['groqApiKey'], (result) => {
    if (result.groqApiKey) {
      apiKeyInput.value = result.groqApiKey;
    }
  });

  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('请输入API Key', 'error');
      return;
    }

    chrome.storage.sync.set({
      groqApiKey: apiKey
    }, () => {
      showStatus('设置已保存', 'success');
    });
  });

  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}); 