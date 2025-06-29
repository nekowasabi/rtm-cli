# 🚀 使用方法ガイド

## 基本的な使い方

RTM CLIツールは3つの主要なコマンドを提供します：

- `login` - Remember the Milkにログイン
- `logout` - ログアウト
- `status` - ログイン状態の確認

## コマンド詳細

### login コマンド

Remember the Milkにログインします。

#### 基本構文

```bash
rtm login [OPTIONS]
```

#### オプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|--------|------|-----------|
| `--username` | `-u` | ユーザー名またはメールアドレス | - |
| `--password` | `-p` | パスワード | - |
| `--save` | `-s` | 認証情報を暗号化して保存 | false |
| `--interactive` | `-i` | インタラクティブモードで入力 | false |
| `--env` | - | 環境変数から認証情報を取得 | false |
| `--headless` | - | ヘッドレスモードで実行 | true |

#### 使用例

##### 1. 環境変数を使用

```bash
# 環境変数を設定
export RTM_USERNAME="user@example.com"
export RTM_PASSWORD="mypassword"

# ログイン
rtm login --env
```

##### 2. コマンドライン引数で指定

```bash
# 認証情報を保存しない場合
rtm login -u "user@example.com" -p "mypassword"

# 認証情報を保存する場合
rtm login -u "user@example.com" -p "mypassword" --save
```

##### 3. インタラクティブモード

```bash
rtm login --interactive
# → ユーザー名またはメールアドレス: user@example.com
# → パスワード: [入力非表示]
# → 認証情報を保存しますか？ (y/N): y
```

##### 4. 保存された認証情報を使用

```bash
# 初回: 認証情報を保存
rtm login -u "user@example.com" -p "mypassword" --save

# 2回目以降: 保存された認証情報で自動ログイン
rtm login
```

##### 5. ブラウザを表示してログイン

```bash
# デバッグ時などにブラウザを表示
rtm login --env --headless=false
```

### logout コマンド

ログアウトします。

#### 基本構文

```bash
rtm logout [OPTIONS]
```

#### オプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|--------|------|-----------|
| `--clear-credentials` | `-c` | 保存された認証情報も削除 | false |
| `--force` | `-f` | 確認なしで実行 | false |

#### 使用例

```bash
# セッションのみクリア
rtm logout

# 保存された認証情報も削除
rtm logout --clear-credentials

# 確認なしで認証情報を削除
rtm logout --clear-credentials --force
```

### status コマンド

現在のログイン状態を確認します。

#### 基本構文

```bash
rtm status [OPTIONS]
```

#### オプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|--------|------|-----------|
| `--verbose` | `-v` | 詳細情報を表示 | false |

#### 使用例

```bash
# 基本的なステータス確認
rtm status

# 詳細情報を表示
rtm status --verbose
```

#### 出力例

```bash
$ rtm status
Status: ログイン済み
User: user@example.com
Session: アクティブ

$ rtm status --verbose
Status: ログイン済み
User: user@example.com
Session: アクティブ
Login Time: 2024-06-29 10:30:15
Config File: /home/user/.rtm/config.json
Auth File: /home/user/.rtm/auth.json (暗号化済み)
```

## 認証方法の詳細

### 1. 環境変数方式 (推奨)

```bash
# 環境変数を設定
export RTM_USERNAME="user@example.com"
export RTM_PASSWORD="mypassword"

# 永続的な設定
echo 'export RTM_USERNAME="user@example.com"' >> ~/.bashrc
echo 'export RTM_PASSWORD="mypassword"' >> ~/.bashrc
source ~/.bashrc

# ログイン
rtm login --env
```

#### メリット
- セキュア（コマンド履歴に残らない）
- 自動化に適している
- CI/CDで使用可能

#### デメリット
- 初回設定が必要
- 環境変数を忘れやすい

### 2. 保存された認証情報方式

```bash
# 初回: 認証情報を保存
rtm login -u "user@example.com" -p "mypassword" --save

# 2回目以降: 自動ログイン
rtm login
```

#### メリット
- 2回目以降は簡単
- 暗号化されて保存

#### デメリット
- 初回にパスワードが履歴に残る可能性
- ファイルが削除されると再設定が必要

### 3. インタラクティブ方式

```bash
rtm login --interactive
```

#### メリット
- 最もセキュア
- パスワードが履歴に残らない

#### デメリット
- 毎回入力が必要
- 自動化に不向き

## 実用的なワークフロー

### 開発環境での使用

```bash
# 開発用の環境変数設定
echo 'export RTM_USERNAME="dev@example.com"' >> ~/.bashrc
echo 'export RTM_PASSWORD="devpassword"' >> ~/.bashrc
source ~/.bashrc

# ログイン
rtm login --env

# 開発作業...

# ログアウト
rtm logout
```

### 本番環境での使用

```bash
# セキュアな認証情報管理
rtm login --interactive

# ステータス確認
rtm status

# 作業完了後
rtm logout --clear-credentials
```

### CI/CDでの使用

```bash
# GitHub Actions等での使用例
- name: RTM Login
  env:
    RTM_USERNAME: ${{ secrets.RTM_USERNAME }}
    RTM_PASSWORD: ${{ secrets.RTM_PASSWORD }}
  run: |
    rtm login --env --headless
    rtm status
    # タスク処理...
    rtm logout
```

### 一時的な使用

```bash
# 一回限りの使用
RTM_USERNAME="temp@example.com" RTM_PASSWORD="temppass" rtm login --env

# または
rtm login -u "temp@example.com" -p "temppass"
```

## 設定ファイル

### 設定ファイルの場所

- **Linux/macOS**: `~/.rtm/`
- **Windows**: `%USERPROFILE%\.rtm\`

### ファイル構成

```
~/.rtm/
├── config.json          # 一般設定
├── auth.json            # 暗号化された認証情報
└── session.json         # セッション情報
```

### config.json の例

```json
{
  "defaultHeadless": true,
  "timeout": 30000,
  "retryCount": 3,
  "logLevel": "info"
}
```

## エラーハンドリング

### よくあるエラーと対処法

#### 1. 認証エラー

```bash
Error: 認証に失敗しました

# 対処法:
rtm status --verbose          # 現在の状態を確認
rtm logout --clear-credentials # 認証情報をクリア
rtm login --interactive       # 再度ログイン
```

#### 2. ネットワークエラー

```bash
Error: Remember the Milkに接続できません

# 対処法:
rtm login --env --headless=false  # ブラウザを表示して確認
```

#### 3. ブラウザエラー

```bash
Error: browserType.launch: Executable doesn't exist

# 対処法:
npx playwright install chromium
```

## 高度な使用方法

### スクリプトでの自動化

```bash
#!/bin/bash
# rtm-automation.sh

# ログイン状態を確認
if ! rtm status > /dev/null 2>&1; then
    echo "ログインが必要です"
    rtm login --env || exit 1
fi

# 何らかの処理...
echo "処理を実行中..."

# 処理完了
echo "処理が完了しました"
```

### エラーハンドリング付きスクリプト

```bash
#!/bin/bash
set -e

# ログイン
if rtm login --env; then
    echo "ログイン成功"
else
    echo "ログイン失敗: 認証情報を確認してください" >&2
    exit 1
fi

# 処理実行
if rtm status --verbose; then
    echo "処理を実行します"
    # 実際の処理...
else
    echo "ログイン状態を確認できません" >&2
    exit 1
fi

# クリーンアップ
rtm logout
```

## パフォーマンス最適化

### ヘッドレスモード

```bash
# デフォルト (高速)
rtm login --env

# ヘッドレスモード明示的に指定
rtm login --env --headless

# ブラウザ表示 (デバッグ用、低速)
rtm login --env --headless=false
```

### タイムアウト設定

```bash
# 設定ファイルでタイムアウトを調整
# ~/.rtm/config.json
{
  "timeout": 60000,  # 60秒
  "retryCount": 5
}
```

---

詳細な問題解決については、[トラブルシューティングガイド](troubleshooting.md)を参照してください。