# 記帳 PWA — 安裝與使用說明

這是一個網頁版 APP（PWA）：用手機 Chrome 開啟網址後「安裝」到主畫面，之後就像一般 APP 一樣使用，可離線。所有資料只存在你手機的瀏覽器裡，不會上傳到任何伺服器。

## 一、放上網址（只需做一次）

PWA 必須透過 https 網址開啟才能安裝與離線使用，直接在手機點開 index.html 檔案無法安裝。以下用免費的 GitHub Pages：

1. 到 https://github.com 註冊並登入。
2. 右上角「＋」→「New repository」，名稱例如 `jizhang`，選 Public，按「Create repository」。
3. 在新的 repository 頁面點「uploading an existing file」，把本資料夾（app）裡的所有檔案與 icons 資料夾拖進去，按「Commit changes」。
4. 進入「Settings」→「Pages」，Source 選「Deploy from a branch」，Branch 選 `main`、資料夾 `/ (root)`，按「Save」。
5. 等 1～2 分鐘，頁面上方會出現網址，例如 `https://你的帳號.github.io/jizhang/`。

注意：不要把 `invoice_export_*.csv` 發票檔或備份檔上傳到 GitHub，裡面有你的消費紀錄。

## 二、安裝到 Android 手機

1. 用手機 Chrome 開啟上面的網址。
2. 點右上角「⋮」→「安裝應用程式」或「加到主畫面」。
3. 主畫面會出現「記帳」圖示，之後從圖示開啟即可，沒有網路也能用。

## 三、匯入電子發票

1. 在財政部電子發票整合服務平台下載載具消費明細 CSV（檔名像 `invoice_export_11510.csv`）。
2. 開啟 APP →「發票」分頁 →「匯入發票檔」，選這個檔案。
3. 每張發票會進入「待確認」，選好分類與付款帳戶後按「確認」才會計入支出。
4. 勾選「記住此店家的分類與帳戶」，下次同一家店的發票會自動帶入。
5. 同一個檔案重複匯入時，已匯入的發票會自動略過。

## 四、備份（很重要）

資料只在這支手機的瀏覽器裡。清除 Chrome 的網站資料、移除 APP 或換手機，資料都會不見。

- 「設定」→「備份資料」會下載 `jizhang_backup_日期.json`，請存到雲端硬碟或電腦，建議每月一次。
- 換手機時，在新手機安裝後到「設定」→「從備份還原」選這個檔案。

## 五、更新版本

之後若修改程式，把新的檔案重新上傳到 GitHub 覆蓋舊檔即可。手機上的 APP 下次連網開啟時會自動更新（若沒更新，可關閉 APP 再開一次）。更新不會刪除你的資料。

## 檔案說明

| 檔案 | 用途 |
| --- | --- |
| index.html | 主頁面 |
| app.js | 畫面與功能 |
| db.js | 手機內的資料庫（IndexedDB） |
| styles.css | 樣式 |
| sw.js | 離線快取 |
| manifest.webmanifest、icons/ | 安裝到主畫面所需的名稱與圖示 |
