# 出退勤打刻アプリ

スマートフォンからワンタップで出退勤を打刻し、管理者のLINEグループに自動通知するPWAアプリです。

## 主な機能

- ワンタップで出勤・退勤打刻
- LINEグループへの自動通知
- Google スプレッドシートへの自動記録
- 勤務時間の自動計算
- 課題完了報告機能
- PWA対応（スマホホーム画面に追加可能）
- オフラインでもアプリ起動可能

## ファイル構成

```
課題５new/
├── index.html              # メインHTMLファイル
├── style.css               # スタイルシート
├── app.js                  # アプリのメインロジック
├── manifest.json           # PWA設定ファイル
├── service-worker.js       # Service Worker（オフライン対応）
├── Code.gs                 # Google Apps Scriptコード
├── icon-guide.html         # アイコン生成ツール
├── セットアップ手順書.md   # 詳細なセットアップ手順
└── README.md               # このファイル
```

## クイックスタート

1. **GASの設定**
   - [スプレッドシート](https://docs.google.com/spreadsheets/d/1VCsV0AMkzIUBMkvqWFXmQxo3ymqXIZNbK-X8K1XufgM/edit)を開く
   - 「拡張機能」→「Apps Script」を開く
   - `Code.gs` の内容を貼り付け
   - 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」として公開
   - Web App URLをコピー

2. **アプリのデプロイ**
   - GitHub Pages、Netlify等にファイルをアップロード
   - または、Webサーバーに配置

3. **アイコンの作成**
   - `icon-guide.html` を開いてアイコンをダウンロード
   - `icon-192.png` と `icon-512.png` として保存

4. **スマホで使用**
   - ブラウザでアプリのURLを開く
   - 名前、ユーザーID、GAS URLを入力
   - ホーム画面に追加してアプリのように使用

## 詳細な手順

詳しいセットアップ方法は [セットアップ手順書.md](./セットアップ手順書.md) をご覧ください。

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla JS)
- **バックエンド**: Google Apps Script
- **データベース**: Google Spreadsheet
- **通知**: LINE Messaging API
- **ホスティング**: GitHub Pages / Netlify / 任意のWebサーバー
- **PWA**: Service Worker, Web App Manifest

## システム構成

```
[スマートフォン]
     ↓ (タップ)
[PWAアプリ (HTML/CSS/JS)]
     ↓ (POST)
[Google Apps Script]
     ├→ [Google Spreadsheet] (データ保存)
     └→ [LINE Messaging API] (通知送信)
         └→ [LINEグループ]
```

## 通知フォーマット

### 出勤通知
```
【出勤】
田中太郎
2025/10/05 09:05
```

### 退勤通知
```
【退勤】
田中太郎
2025/10/05 18:10
勤務時間: 9時間5分
```

### 課題完了報告
```
【🎉課題完了報告🎉】
研修生：田中太郎（user01）
完了：2025/10/05 15:30

アプリURL:
https://...

確認をお願いします！
```

## セキュリティ

- LINE アクセストークンは `Code.gs` にハードコード
- 本番環境では、GASのプロパティサービスの使用を推奨
- GAS Web Appは「全員」に公開（社内限定にする場合は設定変更）

## ブラウザサポート

- Chrome/Edge: 完全対応
- Safari: 完全対応（iOS 11.3以降）
- Firefox: 完全対応

## ライセンス

VEXUM研修用

## 作成日

2025年10月30日
