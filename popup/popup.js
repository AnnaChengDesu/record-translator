let mediaRecorder = null;
let audioChunks = [];

document.addEventListener('DOMContentLoaded', () => {
  const recordBtn = document.getElementById('record-btn');
  const statusText = document.getElementById('status-text');
  const resultContainer = document.getElementById('result-container');
  const translationResult = document.getElementById('translation-result');
  const copyBtn = document.getElementById('copy-btn');
  const restartBtn = document.getElementById('restart-btn');

  recordBtn.addEventListener('click', handleRecordClick);
  copyBtn.addEventListener('click', copyTranslation);
  restartBtn.addEventListener('click', restartRecording);

  function handleRecordClick() {
    if (recordBtn.textContent === '录制') {
      startRecording();
    } else if (recordBtn.textContent === '停止') {
      stopRecording();
    }
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持录音功能');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = sendAudioForTranslation;

      mediaRecorder.start();
      recordBtn.textContent = '停止';
      recordBtn.classList.remove('idle');
      recordBtn.classList.add('recording');
      statusText.textContent = '录音进行中';
      statusText.classList.add('blinking');
    } catch (err) {
      console.error('录音失败:', err);
      if (err.name === 'NotAllowedError') {
        alert('请允许使用麦克风权限以进行录音');
      } else if (err.name === 'NotFoundError') {
        alert('未找到麦克风设备');
      } else {
        alert('录音失败: ' + err.message);
      }
    }
  }

  function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    recordBtn.textContent = '翻译中';
    recordBtn.disabled = true;
    recordBtn.classList.remove('recording');
    recordBtn.classList.add('disabled');
    statusText.textContent = '翻译中';
  }

  async function sendAudioForTranslation() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        alert('请先在扩展程序选项中设置API密钥');
        restartRecording();
        return;
      }

      statusText.textContent = '翻译中...';
      statusText.classList.add('blinking');
      
      const response = await fetch('https://api.groq.com/openai/v1/audio/translations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`翻译失败! ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      displayTranslation(data.text);
    } catch (err) {
      console.error('处理失败:', err);
      alert('处理失败: ' + err.message);
      restartRecording();
    }
  }

  function displayTranslation(text) {
    statusText.classList.remove('blinking');
    statusText.textContent = '翻译完成';
    translationResult.value = text;
    resultContainer.classList.remove('hidden');
    recordBtn.style.display = 'none';
  }

  function copyTranslation() {
    translationResult.select();
    document.execCommand('copy');
    alert('文本已复制到剪贴板');
  }

  function restartRecording() {
    recordBtn.textContent = '录制';
    recordBtn.disabled = false;
    recordBtn.style.display = 'block';
    recordBtn.classList.remove('disabled');
    recordBtn.classList.add('idle');
    statusText.textContent = '点击下方按钮录制语音并翻译成英文';
    statusText.classList.remove('blinking');
    resultContainer.classList.add('hidden');
  }

  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['groqApiKey'], (result) => {
        resolve(result.groqApiKey);
      });
    });
  }
}); 