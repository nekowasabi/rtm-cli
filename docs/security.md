# 🔐 セキュリティガイド

## セキュリティ概要

RTM CLIツールは、Remember the Milkの認証情報を安全に管理するために、複数層のセキュリティ対策を実装しています。

## 認証情報の保護

### 暗号化方式

#### AES-GCM暗号化
- **アルゴリズム**: AES-256-GCM
- **キー長**: 256ビット
- **認証付き暗号化**: データの整合性と機密性を同時に保護
- **初期化ベクタ**: 各暗号化操作で一意のIVを生成

```typescript
// 実装例（参考）
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);

const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv: iv },
  key,
  data
);
```

#### キー管理
- **キー生成**: Web Crypto APIを使用した暗号論的に安全な乱数生成
- **キー保存**: ローカルファイルシステムに安全に保存
- **キーローテーション**: 必要に応じて手動でキーを再生成可能

### ファイルシステム保護

#### ファイル権限（Unix系OS）

```bash
# 設定ディレクトリ
~/.rtm/                    # 700 (所有者のみアクセス可能)
├── config.json           # 600 (所有者のみ読み書き可能)
├── auth.json             # 600 (暗号化済み認証情報)
└── session.json          # 600 (セッション情報)
```

#### 権限の確認と修正

```bash
# 現在の権限を確認
ls -la ~/.rtm/

# 権限を修正
chmod 700 ~/.rtm/
chmod 600 ~/.rtm/*.json
```

### メモリ保護

#### 機密情報のクリア
- **使用後のクリア**: パスワード等の機密情報を使用後に即座にクリア
- **ガベージコレクション**: TypeScript/V8エンジンのGCに依存しない明示的なクリア
- **スコープ制限**: 機密情報のスコープを最小限に制限

```typescript
// 実装例（参考）
function secureProcess(password: string): void {
  try {
    // パスワードを使用した処理
    performAuthentication(password);
  } finally {
    // メモリから明示的にクリア
    password = '';  // プリミティブ型の場合
    // オブジェクトの場合は内容を上書き
  }
}
```

## 認証方式別セキュリティ

### 1. 環境変数方式（推奨）

#### セキュリティレベル: ⭐⭐⭐⭐⭐

**利点**:
- コマンド履歴に残らない
- プロセス間で共有されない（適切に設定した場合）
- システム起動時に自動設定可能

**注意点**:
```bash
# ✅ セキュア: 設定ファイルから読み込み
echo 'export RTM_USERNAME="user@example.com"' >> ~/.bashrc
echo 'export RTM_PASSWORD="$(cat ~/.rtm/password.txt)"' >> ~/.bashrc

# ❌ 非セキュア: コマンドラインで直接設定
export RTM_PASSWORD="mypassword"  # プロセス一覧で見える可能性
```

**推奨設定**:
```bash
# ~/.bashrc または ~/.zshrc
export RTM_USERNAME="user@example.com"

# macOSの場合: Keychainから取得
export RTM_PASSWORD="$(security find-generic-password -a rtm -s rtm -w 2>/dev/null)"

# Linuxの場合: 暗号化ファイルから取得
export RTM_PASSWORD="$(gpg --decrypt ~/.rtm/password.gpg 2>/dev/null)"
```

### 2. 保存された認証情報方式

#### セキュリティレベル: ⭐⭐⭐⭐

**利点**:
- AES-GCM暗号化による強力な保護
- ファイル権限による追加保護
- 自動的なセッション管理

**セキュリティ対策**:
```bash
# 初回設定（セキュア）
rtm login --interactive --save

# ❌ 避けるべき（履歴に残る）
rtm login -u "user@example.com" -p "password" --save
```

### 3. インタラクティブ方式

#### セキュリティレベル: ⭐⭐⭐⭐⭐

**利点**:
- パスワードがファイルや履歴に一切残らない
- 入力時にマスクされる
- 最も安全な方式

**使用例**:
```bash
rtm login --interactive
# ユーザー名またはメールアドレス: user@example.com
# パスワード: [入力非表示]
```

## ネットワークセキュリティ

### HTTPS通信

- **プロトコル**: HTTPS (TLS 1.2+)
- **証明書検証**: 自動的な証明書チェーン検証
- **HSTS**: HTTP Strict Transport Security対応

### プロキシ環境

```bash
# プロキシ設定（必要な場合）
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# 認証付きプロキシ
export HTTPS_PROXY=http://username:password@proxy.example.com:8080
```

## セキュリティベストプラクティス

### 1. 認証情報管理

#### ✅ 推奨事項

```bash
# 1. 環境変数の使用
export RTM_USERNAME="user@example.com"
export RTM_PASSWORD="$(secure-password-source)"

# 2. インタラクティブログイン
rtm login --interactive

# 3. 定期的な認証情報ローテーション
rtm logout --clear-credentials
rtm login --interactive --save

# 4. セッション管理
rtm status  # 定期的な状態確認
rtm logout  # 使用後のログアウト
```

#### ❌ 避けるべき事項

```bash
# パスワードをコマンドラインに直接記述
rtm login -p "mypassword"

# 平文でのスクリプト埋め込み
echo "rtm login -p 'hardcoded-password'" > script.sh

# 権限の緩いファイルへの保存
echo "password123" > /tmp/password.txt
```

### 2. システムセキュリティ

#### ファイルシステム保護

```bash
# ホームディレクトリの権限確認
ls -la ~/
chmod 755 ~/  # 適切な権限設定

# rtm設定ディレクトリの保護
chmod 700 ~/.rtm/
chmod 600 ~/.rtm/*

# 一時ファイルの削除
rm -f /tmp/rtm_*
```

#### プロセス保護

```bash
# 不要なプロセスの終了
pkill -f rtm

# プロセス監視
ps aux | grep rtm
```

### 3. ネットワークセキュリティ

#### 接続の確認

```bash
# SSL証明書の検証
openssl s_client -connect rememberthemilk.com:443 -verify 5

# DNS設定の確認
nslookup rememberthemilk.com
dig rememberthemilk.com
```

#### ファイアウォール設定

```bash
# 必要なポートのみ開放
# HTTPS (443) への接続のみ許可

# Ubuntu/Debian (ufw)
sudo ufw allow out 443/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --add-port=443/tcp --permanent
```

## セキュリティ監査

### 1. 定期チェック項目

#### 毎日
```bash
# ログイン状態の確認
rtm status

# 不審なプロセスの確認
ps aux | grep rtm
```

#### 毎週
```bash
# ログファイルの確認
tail -n 100 ~/.rtm/logs/rtm.log | grep -i error

# 設定ファイルの権限確認
ls -la ~/.rtm/
```

#### 毎月
```bash
# 認証情報のローテーション
rtm logout --clear-credentials
rtm login --interactive --save

# システム更新
# Ubuntu/Debian
sudo apt update && sudo apt upgrade

# macOS
brew update && brew upgrade
```

### 2. セキュリティ監査スクリプト

```bash
#!/bin/bash
# rtm-security-audit.sh

echo "=== RTM CLI Security Audit ==="
echo "Date: $(date)"
echo

# ファイル権限チェック
echo "1. File Permissions:"
ls -la ~/.rtm/ 2>/dev/null || echo "Config directory not found"
echo

# プロセスチェック
echo "2. Running Processes:"
ps aux | grep rtm | grep -v grep || echo "No RTM processes running"
echo

# ネットワーク接続チェック
echo "3. Network Connectivity:"
curl -I https://www.rememberthemilk.com 2>/dev/null | head -1 || echo "Connection failed"
echo

# 設定ファイルチェック
echo "4. Configuration Files:"
if [ -f ~/.rtm/config.json ]; then
    echo "config.json exists ($(stat -c%s ~/.rtm/config.json) bytes)"
else
    echo "config.json not found"
fi

if [ -f ~/.rtm/auth.json ]; then
    echo "auth.json exists (encrypted, $(stat -c%s ~/.rtm/auth.json) bytes)"
else
    echo "auth.json not found"
fi
echo

echo "=== Audit Complete ==="
```

## インシデント対応

### 1. 認証情報漏洩の疑い

#### 即座に実行すべき対応

```bash
# 1. 現在のセッションを無効化
rtm logout --force

# 2. 保存された認証情報を削除
rtm logout --clear-credentials --force

# 3. 設定ファイルを削除
rm -rf ~/.rtm/

# 4. Remember the Milkのパスワードを変更
# → Webブラウザでログインしてパスワード変更

# 5. 新しい認証情報で再設定
rtm login --interactive --save
```

### 2. システム侵害の疑い

```bash
# 1. rtmプロセスを全て終了
pkill -f rtm

# 2. 設定ディレクトリのバックアップ
cp -r ~/.rtm/ ~/.rtm.backup.$(date +%Y%m%d_%H%M%S)

# 3. ログファイルの確認
grep -i "suspicious\|unauthorized\|failed" ~/.rtm/logs/rtm.log

# 4. システム全体のセキュリティチェック
# - マルウェアスキャン
# - システムログ確認
# - ネットワーク接続監視
```

## 企業環境での使用

### 1. ポリシー準拠

#### 認証情報管理ポリシー
- パスワードの複雑性要件
- 定期的なパスワード変更
- 多要素認証の利用（Remember the Milk側）
- アクセスログの記録

#### データ保護ポリシー
- 暗号化要件（AES-256以上）
- データ保存期間
- バックアップとリストア手順
- インシデント対応手順

### 2. 監査とコンプライアンス

```bash
# 監査ログの設定
# ~/.rtm/config.json
{
  "logLevel": "audit",
  "auditLog": true,
  "logRetention": 90
}

# 定期的な監査レポート生成
rtm audit --report --output audit-report-$(date +%Y%m%d).json
```

## セキュリティアップデート

### 1. 脆弱性情報の確認

- [GitHub Security Advisories](https://github.com/nekowasabi/rtm-cli/security/advisories)
- [Deno Security Updates](https://deno.land/std/SECURITY.md)
- [Playwright Security](https://playwright.dev/docs/security)

### 2. 自動更新の設定

```bash
# 定期的なセキュリティチェック
#!/bin/bash
# security-check.sh

# 最新版の確認
LATEST=$(curl -s https://api.github.com/repos/nekowasabi/rtm-cli/releases/latest | grep tag_name | sed 's/.*"v\([^"]*\)".*/\1/')
CURRENT=$(rtm --version | sed 's/rtm v\([0-9.]*\).*/\1/')

if [ "$LATEST" != "$CURRENT" ]; then
    echo "Security update available: $CURRENT -> $LATEST"
    echo "Please update rtm-cli for security fixes"
fi
```

---

**重要**: セキュリティは継続的なプロセスです。定期的な見直しと更新を行い、最新のセキュリティ対策を適用してください。