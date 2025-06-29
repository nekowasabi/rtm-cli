# 📦 インストールガイド

## 前提条件

### システム要件

- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+, CentOS 7+)
- **Deno**: バージョン 1.40 以上
- **Node.js**: バージョン 18+ (Playwright用)
- **ディスク容量**: 最小 500MB (Playwrightブラウザ含む)
- **メモリ**: 最小 2GB RAM

### 必要なツール

```bash
# Denoのインストール (まだインストールしていない場合)
curl -fsSL https://deno.land/install.sh | sh

# Node.jsのインストール (Playwright用)
# macOS
brew install node

# Ubuntu/Debian
sudo apt-get install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm
```

## インストール方法

### 方法 1: プリビルドバイナリ (推奨)

```bash
# 最新リリースをダウンロード
curl -L https://github.com/nekowasabi/rtm-cli/releases/latest/download/rtm-linux -o rtm
chmod +x rtm

# システムパスに配置
sudo mv rtm /usr/local/bin/

# インストール確認
rtm --help
```

### 方法 2: ソースからビルド

```bash
# リポジトリをクローン
git clone https://github.com/nekowasabi/rtm-cli.git
cd rtm-cli

# Playwrightブラウザをインストール
npx playwright install chromium

# 依存関係の確認
deno task check

# バイナリをビルド
deno task build

# ビルド成果物を確認
ls -la ./rtm

# システムパスに配置
sudo cp ./rtm /usr/local/bin/
```

### 方法 3: 開発モードでの実行

```bash
# リポジトリをクローン
git clone https://github.com/nekowasabi/rtm-cli.git
cd rtm-cli

# 開発モードで実行
deno task dev --help
```

## プラットフォーム別の詳細

### Windows

```powershell
# PowerShellを管理者権限で実行
# Denoのインストール
iwr https://deno.land/install.ps1 -useb | iex

# rtm-cliをダウンロード
Invoke-WebRequest -Uri "https://github.com/nekowasabi/rtm-cli/releases/latest/download/rtm-windows.exe" -OutFile "rtm.exe"

# PATHに追加
$env:PATH += ";C:\path\to\rtm"
```

### macOS

```bash
# Homebrewを使用
brew install deno

# rtm-cliをダウンロード
curl -L https://github.com/nekowasabi/rtm-cli/releases/latest/download/rtm-macos -o rtm
chmod +x rtm
sudo mv rtm /usr/local/bin/
```

### Linux (Ubuntu/Debian)

```bash
# Denoのインストール
curl -fsSL https://deno.land/install.sh | sh
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# rtm-cliをダウンロード
curl -L https://github.com/nekowasabi/rtm-cli/releases/latest/download/rtm-linux -o rtm
chmod +x rtm
sudo mv rtm /usr/local/bin/
```

## 初期設定

### 1. Playwrightブラウザのインストール

```bash
# Chromiumブラウザをインストール
npx playwright install chromium

# すべてのブラウザをインストール (オプション)
npx playwright install
```

### 2. 認証情報の設定

```bash
# 環境変数を設定
export RTM_USERNAME="your@email.com"
export RTM_PASSWORD="yourpassword"

# 永続的な設定 (推奨)
echo 'export RTM_USERNAME="your@email.com"' >> ~/.bashrc
echo 'export RTM_PASSWORD="yourpassword"' >> ~/.bashrc
source ~/.bashrc
```

### 3. 初回ログインテスト

```bash
# インストール確認
rtm --version

# ログインテスト
rtm login --env --headless

# ステータス確認
rtm status
```

## トラブルシューティング

### よくある問題

#### 1. `rtm: command not found`

```bash
# PATHを確認
echo $PATH

# rtmの場所を確認
which rtm

# PATHに追加
export PATH="$PATH:/path/to/rtm"
```

#### 2. Playwrightブラウザが見つからない

```bash
# エラーメッセージ例:
# browserType.launch: Executable doesn't exist

# 解決方法:
npx playwright install chromium

# インストール確認
npx playwright list-browsers
```

#### 3. 権限エラー

```bash
# 実行権限を確認
ls -la /usr/local/bin/rtm

# 実行権限を付与
chmod +x /usr/local/bin/rtm

# 所有者を確認
ls -la ~/.rtm/
```

#### 4. ネットワークエラー

```bash
# プロキシ設定が必要な場合
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# DNS設定を確認
nslookup rememberthemilk.com
```

## アップデート

### バイナリのアップデート

```bash
# 現在のバージョンを確認
rtm --version

# 最新版をダウンロード
curl -L https://github.com/nekowasabi/rtm-cli/releases/latest/download/rtm-linux -o rtm-new
chmod +x rtm-new

# バックアップを作成
cp /usr/local/bin/rtm /usr/local/bin/rtm.backup

# 新しいバージョンに置き換え
sudo mv rtm-new /usr/local/bin/rtm

# アップデート確認
rtm --version
```

### ソースからのアップデート

```bash
cd rtm-cli

# 最新コードを取得
git pull origin main

# 依存関係を更新
deno cache --reload src/main.ts

# 再ビルド
deno task build
```

## アンインストール

### バイナリのアンインストール

```bash
# バイナリを削除
sudo rm /usr/local/bin/rtm

# 設定ファイルを削除 (オプション)
rm -rf ~/.rtm/

# 環境変数を削除
# ~/.bashrc, ~/.zshrc等から RTM_USERNAME, RTM_PASSWORD の行を削除
```

### 完全なアンインストール

```bash
# バイナリを削除
sudo rm /usr/local/bin/rtm

# 設定ディレクトリを削除
rm -rf ~/.rtm/

# Playwrightブラウザを削除 (他で使用していない場合)
npx playwright uninstall

# 環境変数を削除
unset RTM_USERNAME
unset RTM_PASSWORD
```

## 検証

インストールが完了したら、以下のコマンドで動作を確認してください：

```bash
# バージョン確認
rtm --version

# ヘルプ表示
rtm --help

# 設定確認
rtm status

# 実際のログインテスト (認証情報を設定済みの場合)
rtm login --env --headless
```

---

**注意**: インストール中に問題が発生した場合は、[トラブルシューティングガイド](troubleshooting.md)を参照してください。