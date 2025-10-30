// Google Apps Script - 出退勤打刻アプリバックエンド

// 設定
const LINE_ACCESS_TOKEN = 'YOZ7UftinQaO3OyBDaloYu4cXzhYtLzmqBzAGNvCIJRg7h+DoqsX0n6OXdfOFZ9vI7/+VIOKgdWLHJ6yBmeAi6kPqz4+FZ3vpHQTBEAQSHA81c9tQLH/8oP8UUyRpnHxvmJ0QlaAjZWiraJeO38tBgdB04t89/1O/w1cDnyilFU=';
const LINE_GROUP_ID = 'C5a5b36e27a78ed6cfbb74839a8a9d04e';
const SPREADSHEET_ID = '1VCsV0AMkzIUBMkvqWFXmQxo3ymqXIZNbK-X8K1XufgM';

// doPost: フロントエンドからのPOSTリクエストを処理
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;
    switch(action) {
      case 'clock_in':
        result = handleClockIn(data);
        break;
      case 'clock_out':
        result = handleClockOut(data);
        break;
      case 'task_complete':
        result = handleTaskComplete(data);
        break;
      default:
        result = { success: false, message: '不明なアクションです' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'エラーが発生しました: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// doGet: CORSテスト用
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'API is working'
  })).setMimeType(ContentService.MimeType.JSON);
}

// 出勤打刻処理
function handleClockIn(data) {
  const userName = data.userName;
  const userId = data.userId;
  const timestamp = new Date();
  const formattedDate = Utilities.formatDate(timestamp, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');

  // スプレッドシートに記録
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  sheet.appendRow([
    userId,
    userName,
    '出勤',
    formattedDate,
    '', // 退勤時刻（空）
    '', // 勤務時間（空）
  ]);

  // LINE通知
  const message = `【出勤】\n${userName}\n${formattedDate}`;
  sendLineMessage(message);

  return {
    success: true,
    message: '出勤を記録しました',
    timestamp: formattedDate
  };
}

// 退勤打刻処理
function handleClockOut(data) {
  const userName = data.userName;
  const userId = data.userId;
  const clockInTime = new Date(data.clockInTime);
  const clockOutTime = new Date();

  const formattedClockOut = Utilities.formatDate(clockOutTime, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');

  // 勤務時間を計算（ミリ秒→時間）
  const workDuration = (clockOutTime - clockInTime) / (1000 * 60 * 60);
  const hours = Math.floor(workDuration);
  const minutes = Math.floor((workDuration - hours) * 60);
  const formattedDuration = `${hours}時間${minutes}分`;

  // スプレッドシートの最後の出勤記録を更新
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const lastRow = sheet.getLastRow();

  // 最後の行から上に向かって、該当ユーザーの退勤時刻が空白の行を探す
  for (let i = lastRow; i >= 2; i--) {
    const rowUserId = sheet.getRange(i, 1).getValue();
    const rowType = sheet.getRange(i, 3).getValue();
    const rowClockOut = sheet.getRange(i, 5).getValue();

    if (rowUserId === userId && rowType === '出勤' && rowClockOut === '') {
      sheet.getRange(i, 5).setValue(formattedClockOut);
      sheet.getRange(i, 6).setValue(formattedDuration);
      break;
    }
  }

  // LINE通知
  const message = `【退勤】\n${userName}\n${formattedClockOut}\n勤務時間: ${formattedDuration}`;
  sendLineMessage(message);

  return {
    success: true,
    message: '退勤を記録しました',
    timestamp: formattedClockOut,
    duration: formattedDuration
  };
}

// 課題完了報告処理
function handleTaskComplete(data) {
  const userName = data.userName;
  const userId = data.userId;
  const appUrl = data.appUrl;
  const timestamp = new Date();
  const formattedDate = Utilities.formatDate(timestamp, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');

  // スプレッドシートに記録
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  sheet.appendRow([
    userId,
    userName,
    '課題完了',
    formattedDate,
    appUrl,
    ''
  ]);

  // LINE通知
  const message = `【🎉課題完了報告🎉】\n研修生：${userName}（${userId}）\n完了：${formattedDate}\n\nアプリURL:\n${appUrl}\n\n確認をお願いします！`;
  sendLineMessage(message);

  return {
    success: true,
    message: '課題完了を報告しました',
    timestamp: formattedDate
  };
}

// LINE Messaging APIでメッセージ送信
function sendLineMessage(message) {
  const url = 'https://api.line.me/v2/bot/message/push';

  const payload = {
    to: LINE_GROUP_ID,
    messages: [{
      type: 'text',
      text: message
    }]
  };

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    Logger.log('LINE API Error: ' + response.getContentText());
    throw new Error('LINE通知に失敗しました');
  }

  return true;
}
