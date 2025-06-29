# 🐛 トラブルシューティングガイド

## よくある問題と解決方法

### インストール・設定関連

#### 1. `rtm: command not found`

**症状**: rtmコマンドが見つからない

**原因**: 
- rtmがPATHに含まれていない
- インストールが不完全

**解決方法**:
```bash
# rtmの場所を確認
which rtm
find /usr -name "rtm" 2>/dev/null

# PATHを確認
echo $PATH

# PATHにrtmの場所を追加
export PATH="$PATH:/usr/local/bin"

# 永続的に設定
echo 'export PATH="$PATH:/usr/local/bin"' >> ~/.bashrc
source ~/.bashrc
```

#### 2. Playwrightブラウザが見つからない

**症状**: 
```
Error: browserType.launch: Executable doesn't exist at /home/user/.cache/ms-playwright/chromium-1091/chrome-linux/chrome
```

**原因**: Playwrightブラウザがインストールされていない

**解決方法**:
```bash
# Chromiumをインストール
npx playwright install chromium

# すべてのブラウザをインストール
npx playwright install

# インストール確認
npx playwright list-browsers

# Playwrightのバージョン確認
npx playwright --version
```

#### 3. 権限エラー

**症状**: 
```
Error: EACCES: permission denied, mkdir '/home/user/.rtm'
```

**原因**: 設定ディレクトリの作成権限がない

**解決方法**:
```bash
# ホームディレクトリの権限を確認
ls -la ~/

# .rtmディレクトリを手動作成
mkdir -p ~/.rtm
chmod 700 ~/.rtm

# 既存ファイルの権限を修正
chmod 600 ~/.rtm/*.json 2>/dev/null || true
```

### 認証関連

#### 4. ログイン失敗

**症状**: 
```
Error: 認証に失敗しました
```

**原因**: 
- 認証情報が間違っている
- Remember the Milkのサイトが変更された
- ネットワーク接続の問題

**解決方法**:
```bash
# 1. 認証情報を確認
rtm status --verbose

# 2. 保存された認証情報をクリア
rtm logout --clear-credentials

# 3. ブラウザを表示してログイン確認
rtm login --env --headless=false

# 4. インタラクティブモードで再試行
rtm login --interactive

# 5. Remember the Milkに直接ログイン確認
# ブラウザで https://www.rememberthemilk.com/login/ にアクセス
```

#### 5. 環境変数が読み込まれない

**症状**: 
```
Error: 環境変数に完全な認証情報が設定されていません
```

**原因**: 環境変数が正しく設定されていない

**解決方法**:
```bash
# 環境変数を確認
echo "Username: $RTM_USERNAME"
echo "Password: $RTM_PASSWORD"

# 環境変数を再設定
export RTM_USERNAME="your@email.com"
export RTM_PASSWORD="yourpassword"

# 永続的な設定
echo 'export RTM_USERNAME="your@email.com"' >> ~/.bashrc
echo 'export RTM_PASSWORD="yourpassword"' >> ~/.bashrc
source ~/.bashrc

# 設定確認
rtm login --env
```

#### 6. 認証情報の復号化エラー

**症状**: 
```
Error: 認証情報の復号化に失敗しました
```

**原因**: 暗号化キーが変更された、またはファイルが破損

**解決方法**:
```bash
# 破損した認証ファイルを削除
rm ~/.rtm/auth.json

# 設定ファイルも削除（必要に応じて）
rm ~/.rtm/config.json

# 再度ログイン
rtm login --interactive --save
```

### ネットワーク関連

#### 7. 接続タイムアウト

**症状**: 
```
Error: 接続がタイムアウトしました
```

**原因**: 
- インターネット接続が不安定
- ファイアウォールによる遮断
- プロキシ設定が必要

**解決方法**:
```bash
# 1. インターネット接続を確認
ping google.com
curl -I https://www.rememberthemilk.com

# 2. プロキシ設定（必要な場合）
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1

# 3. DNS設定を確認
nslookup rememberthemilk.com

# 4. ファイアウォール設定を確認（Linux）
sudo ufw status
sudo iptables -L

# 5. タイムアウト値を増加
# ~/.rtm/config.json
{
  "timeout": 60000,
  "retryCount": 5
}
```

#### 8. SSL/TLS証明書エラー

**症状**: 
```
Error: certificate verify failed
```

**原因**: SSL証明書の問題

**解決方法**:
```bash
# システムの証明書を更新
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install ca-certificates

# CentOS/RHEL
sudo yum update ca-certificates

# macOS
brew install ca-certificates

# 証明書の確認
openssl s_client -connect rememberthemilk.com:443 < /dev/null
```

### パフォーマンス関連

#### 9. 動作が遅い

**症状**: ログイン処理に時間がかかる

**原因**: 
- ヘッドレスモードが無効
- システムリソース不足
- ネットワークが遅い

**解決方法**:
```bash
# 1. ヘッドレスモードを有効化
rtm login --env --headless

# 2. システムリソースを確認
free -h
df -h
top

# 3. ネットワーク速度を確認
speedtest-cli

# 4. 設定を最適化
# ~/.rtm/config.json
{
  "defaultHeadless": true,
  "timeout": 30000,
  "retryCount": 3
}
```

### システム固有の問題

#### 10. Windows での問題

**症状**: Windowsでコマンドが動作しない

**解決方法**:
```powershell
# PowerShellで実行権限を確認
Get-ExecutionPolicy

# 実行権限を変更（必要な場合）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Windows Defenderの除外設定
# rtm.exeをWindows Defenderの除外リストに追加

# 環境変数の設定（PowerShell）
$env:RTM_USERNAME = "your@email.com"
$env:RTM_PASSWORD = "yourpassword"

# 永続的な設定
[Environment]::SetEnvironmentVariable("RTM_USERNAME", "your@email.com", "User")
[Environment]::SetEnvironmentVariable("RTM_PASSWORD", "yourpassword", "User")
```

#### 11. macOS での問題

**症状**: macOSでブラウザが起動しない

**解決方法**:
```bash
# Xcode Command Line Toolsをインストール
xcode-select --install

# Homebrewでdependenciesをインストール
brew install node

# Playwrightブラウザを再インストール
npx playwright install chromium

# セキュリティ設定を確認
# システム環境設定 > セキュリティとプライバシー > プライバシー
# 「開発者ツール」でrtmを許可
```

#### 12. Linux での問題

**症状**: Linux上でブラウザの依存関係エラー

**解決方法**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgtk-3-0 \
  libgbm1

# CentOS/RHEL
sudo yum install -y \
  nss \
  atk \
  at-spi2-atk \
  gtk3 \
  libdrm \
  libxkbcommon \
  libxcomposite \
  libxdamage \
  libxrandr \
  libgbm \
  libxss1 \
  libasound2

# Arch Linux
sudo pacman -S --needed \
  nss \
  atk \
  at-spi2-atk \
  gtk3 \
  libdrm \
  libxkbcommon \
  libxcomposite \
  libxdamage \
  libxrandr \
  mesa \
  alsa-lib
```

## デバッグ方法

### 1. 詳細ログの取得

```bash
# 詳細ログを有効化
rtm login --env --verbose

# ブラウザを表示してデバッグ
rtm login --env --headless=false

# 設定ファイルでログレベルを変更
# ~/.rtm/config.json
{
  "logLevel": "debug"
}
```

### 2. 設定ファイルの確認

```bash
# 設定ディレクトリの内容確認
ls -la ~/.rtm/

# 設定ファイルの内容確認
cat ~/.rtm/config.json

# 権限の確認
ls -la ~/.rtm/*.json
```

### 3. システム情報の収集

```bash
# システム情報
uname -a
echo "Deno: $(deno --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

# rtmのバージョン
rtm --version

# ネットワーク接続確認
curl -I https://www.rememberthemilk.com

# プロセス確認
ps aux | grep rtm
```

## ログファイルの確認

### ログファイルの場所

```bash
# ログファイルを確認
ls -la ~/.rtm/logs/

# 最新のログを表示
tail -f ~/.rtm/logs/rtm.log

# エラーログのみ抽出
grep ERROR ~/.rtm/logs/rtm.log
```

## 緊急時の対処

### 1. 完全リセット

```bash
# すべての設定を削除
rm -rf ~/.rtm/

# 環境変数をクリア
unset RTM_USERNAME
unset RTM_PASSWORD

# rtmを再インストール
curl -L https://github.com/nekowasabi/rtm-cli/releases/latest/download/rtm-linux -o rtm
chmod +x rtm
sudo mv rtm /usr/local/bin/

# 初期設定からやり直し
rtm login --interactive --save
```

### 2. バックアップからの復元

```bash
# 設定をバックアップ
cp -r ~/.rtm/ ~/.rtm.backup.$(date +%Y%m%d)

# バックアップから復元
cp -r ~/.rtm.backup.20240629/ ~/.rtm/
chmod 700 ~/.rtm/
chmod 600 ~/.rtm/*.json
```

## サポートへの連絡

問題が解決しない場合は、以下の情報を含めてissueを作成してください：

### 必要な情報

```bash
# システム情報を収集
echo "=== System Information ===" > debug-info.txt
uname -a >> debug-info.txt
echo "Deno: $(deno --version)" >> debug-info.txt
echo "Node.js: $(node --version)" >> debug-info.txt
echo "rtm: $(rtm --version)" >> debug-info.txt

echo "=== Configuration ===" >> debug-info.txt
ls -la ~/.rtm/ >> debug-info.txt
cat ~/.rtm/config.json >> debug-info.txt 2>&1

echo "=== Error Logs ===" >> debug-info.txt
tail -n 50 ~/.rtm/logs/rtm.log >> debug-info.txt 2>&1

echo "=== Network Test ===" >> debug-info.txt
curl -I https://www.rememberthemilk.com >> debug-info.txt 2>&1
```

### GitHub Issue の作成

[GitHub Issues](https://github.com/nekowasabi/rtm-cli/issues) で以下の情報を含めて報告してください：

1. **問題の詳細**: 何をしようとして、何が起こったか
2. **再現手順**: 問題を再現する具体的な手順
3. **期待する結果**: 何が起こることを期待していたか  
4. **実際の結果**: 実際に何が起こったか
5. **環境情報**: 上記のdebug-info.txtの内容
6. **エラーメッセージ**: 完全なエラーメッセージ

---

**注意**: 認証情報（パスワード等）は絶対に含めないでください。