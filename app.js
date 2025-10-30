// アプリの状態管理
let appState = {
  isWorking: false,
  clockInTime: null,
  timerInterval: null,
  userName: '',
  userId: '',
  apiUrl: ''
};

// DOM要素
const elements = {
  userNameInput: document.getElementById('userName'),
  userIdInput: document.getElementById('userId'),
  apiUrlInput: document.getElementById('apiUrl'),
  clockInBtn: document.getElementById('clockInBtn'),
  clockOutBtn: document.getElementById('clockOutBtn'),
  taskCompleteBtn: document.getElementById('taskCompleteBtn'),
  appUrlInput: document.getElementById('appUrl'),
  statusMessage: document.getElementById('statusMessage'),
  workTimer: document.getElementById('workTimer'),
  messageBox: document.getElementById('messageBox')
};

// ローカルストレージから設定を読み込む
function loadSettings() {
  const savedUserName = localStorage.getItem('userName');
  const savedUserId = localStorage.getItem('userId');
  const savedApiUrl = localStorage.getItem('apiUrl');
  const savedClockInTime = localStorage.getItem('clockInTime');
  const savedIsWorking = localStorage.getItem('isWorking') === 'true';

  if (savedUserName) elements.userNameInput.value = savedUserName;
  if (savedUserId) elements.userIdInput.value = savedUserId;
  if (savedApiUrl) elements.apiUrlInput.value = savedApiUrl;

  if (savedIsWorking && savedClockInTime) {
    appState.isWorking = true;
    appState.clockInTime = new Date(savedClockInTime);
    appState.userName = savedUserName;
    appState.userId = savedUserId;
    appState.apiUrl = savedApiUrl;

    updateUIForWorkingState();
    startTimer();
  }
}

// 設定を保存
function saveSettings() {
  localStorage.setItem('userName', elements.userNameInput.value);
  localStorage.setItem('userId', elements.userIdInput.value);
  localStorage.setItem('apiUrl', elements.apiUrlInput.value);
}

// 出勤処理
async function clockIn() {
  const userName = elements.userNameInput.value.trim();
  const userId = elements.userIdInput.value.trim();
  const apiUrl = elements.apiUrlInput.value.trim();

  if (!userName || !userId || !apiUrl) {
    showMessage('名前、ユーザーID、GAS URLを入力してください', 'error');
    return;
  }

  try {
    elements.clockInBtn.disabled = true;
    elements.clockInBtn.textContent = '処理中...';

    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'clock_in',
        userName: userName,
        userId: userId
      })
    });

    // no-corsモードでは詳細なレスポンスが取得できないため、
    // エラーがなければ成功とみなす
    appState.isWorking = true;
    appState.clockInTime = new Date();
    appState.userName = userName;
    appState.userId = userId;
    appState.apiUrl = apiUrl;

    // ローカルストレージに保存
    saveSettings();
    localStorage.setItem('clockInTime', appState.clockInTime.toISOString());
    localStorage.setItem('isWorking', 'true');

    updateUIForWorkingState();
    startTimer();

    const formattedTime = formatDateTime(appState.clockInTime);
    showMessage(`出勤を記録しました\n${formattedTime}`, 'success');

  } catch (error) {
    console.error('出勤エラー:', error);
    showMessage('出勤の記録に失敗しました。GAS URLを確認してください。', 'error');
    elements.clockInBtn.disabled = false;
    elements.clockInBtn.innerHTML = '<span class="btn-icon">▶</span>出勤';
  }
}

// 退勤処理
async function clockOut() {
  if (!appState.isWorking || !appState.clockInTime) {
    showMessage('出勤記録がありません', 'error');
    return;
  }

  try {
    elements.clockOutBtn.disabled = true;
    elements.clockOutBtn.textContent = '処理中...';

    const response = await fetch(appState.apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'clock_out',
        userName: appState.userName,
        userId: appState.userId,
        clockInTime: appState.clockInTime.toISOString()
      })
    });

    // タイマーを停止
    stopTimer();

    // 勤務時間を計算
    const workDuration = calculateWorkDuration(appState.clockInTime, new Date());

    // 状態をリセット
    appState.isWorking = false;
    appState.clockInTime = null;
    localStorage.removeItem('clockInTime');
    localStorage.setItem('isWorking', 'false');

    updateUIForIdleState();

    const now = new Date();
    const formattedTime = formatDateTime(now);
    showMessage(`退勤を記録しました\n${formattedTime}\n勤務時間: ${workDuration}`, 'success');

  } catch (error) {
    console.error('退勤エラー:', error);
    showMessage('退勤の記録に失敗しました', 'error');
    elements.clockOutBtn.disabled = false;
    elements.clockOutBtn.innerHTML = '<span class="btn-icon">■</span>退勤';
  }
}

// 課題完了報告
async function reportTaskComplete() {
  const userName = elements.userNameInput.value.trim();
  const userId = elements.userIdInput.value.trim();
  const apiUrl = elements.apiUrlInput.value.trim();
  const appUrl = elements.appUrlInput.value.trim();

  if (!userName || !userId || !apiUrl) {
    showMessage('名前、ユーザーID、GAS URLを入力してください', 'error');
    return;
  }

  if (!appUrl) {
    showMessage('アプリURLを入力してください', 'error');
    return;
  }

  try {
    elements.taskCompleteBtn.disabled = true;
    elements.taskCompleteBtn.textContent = '送信中...';

    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'task_complete',
        userName: userName,
        userId: userId,
        appUrl: appUrl
      })
    });

    showMessage('課題完了を報告しました！', 'success');
    elements.appUrlInput.value = '';

  } catch (error) {
    console.error('課題完了報告エラー:', error);
    showMessage('課題完了の報告に失敗しました', 'error');
  } finally {
    elements.taskCompleteBtn.disabled = false;
    elements.taskCompleteBtn.innerHTML = '<span class="btn-icon">🎉</span>課題完了報告';
  }
}

// UIを勤務中の状態に更新
function updateUIForWorkingState() {
  elements.clockInBtn.disabled = true;
  elements.clockOutBtn.disabled = false;
  elements.userNameInput.disabled = true;
  elements.userIdInput.disabled = true;
  elements.apiUrlInput.disabled = true;

  elements.statusMessage.textContent = `${appState.userName} さん 勤務中`;
  elements.clockInBtn.innerHTML = '<span class="btn-icon">▶</span>出勤';
  elements.clockOutBtn.innerHTML = '<span class="btn-icon">■</span>退勤';
}

// UIをアイドル状態に更新
function updateUIForIdleState() {
  elements.clockInBtn.disabled = false;
  elements.clockOutBtn.disabled = true;
  elements.userNameInput.disabled = false;
  elements.userIdInput.disabled = false;
  elements.apiUrlInput.disabled = false;

  elements.statusMessage.textContent = '';
  elements.workTimer.textContent = '';
  elements.clockInBtn.innerHTML = '<span class="btn-icon">▶</span>出勤';
  elements.clockOutBtn.innerHTML = '<span class="btn-icon">■</span>退勤';
}

// タイマーを開始
function startTimer() {
  updateTimer();
  appState.timerInterval = setInterval(updateTimer, 1000);
}

// タイマーを停止
function stopTimer() {
  if (appState.timerInterval) {
    clearInterval(appState.timerInterval);
    appState.timerInterval = null;
  }
}

// タイマー表示を更新
function updateTimer() {
  if (!appState.clockInTime) return;

  const now = new Date();
  const elapsed = now - appState.clockInTime;

  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

  elements.workTimer.textContent =
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 勤務時間を計算
function calculateWorkDuration(start, end) {
  const elapsed = end - start;
  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}時間${minutes}分`;
}

// 日時フォーマット
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// メッセージ表示
function showMessage(message, type = 'success') {
  elements.messageBox.textContent = message;
  elements.messageBox.className = `message-box show ${type}`;

  setTimeout(() => {
    elements.messageBox.className = 'message-box';
  }, 5000);
}

// イベントリスナー設定
elements.clockInBtn.addEventListener('click', clockIn);
elements.clockOutBtn.addEventListener('click', clockOut);
elements.taskCompleteBtn.addEventListener('click', reportTaskComplete);

// 入力フィールドの変更を保存
elements.userNameInput.addEventListener('change', saveSettings);
elements.userIdInput.addEventListener('change', saveSettings);
elements.apiUrlInput.addEventListener('change', saveSettings);

// Service Workerの登録（PWA）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// アプリ起動時に設定を読み込む
loadSettings();
