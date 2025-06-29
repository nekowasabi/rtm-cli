# 🥛 Remember the Milk CLI Tool

Deno + TypeScript + Playwrightを使用したRemember the Milk用のコマンドラインインターフェースツールです。

## ✨ 特徴

- 🔐 **セキュアな認証管理**: AES-GCM暗号化による認証情報の安全な保存
- 🌍 **環境変数対応**: RTM_USERNAME、RTM_PASSWORDからの認証情報取得
- 🤖 **自動ログイン**: Playwrightによるブラウザ自動化
- 📱 **インタラクティブモード**: 対話形式での認証情報入力
- 🚀 **単一バイナリ**: 依存関係を含む実行可能ファイル
- ✅ **テスト駆動開発**: 56個のユニットテストによる品質保証

## 📦 インストール

### 前提条件

- Deno 1.40以上
- インターネット接続（初回ビルド時）

### バイナリをダウンロード

```bash
# GitHubリリースから最新版をダウンロード（予定）
curl -L https://github.com/nekowasabi/rtm-cli/releases/latest/download/rtm -o rtm
chmod +x rtm
```

### ソースからビルド

```bash
# リポジトリをクローン
git clone https://github.com/nekowasabi/rtm-cli.git
cd rtm-cli

# 依存関係のインストール（Playwrightブラウザ）
npx playwright install

# バイナリをビルド
deno task build

# または、直接実行
deno task dev --help
```

## 🚀 クイックスタート

### 1. 環境変数を設定

```bash
export RTM_USERNAME="your@email.com"
export RTM_PASSWORD="yourpassword"
```

### 2. ログイン

```bash
# 環境変数から認証情報を使用
rtm login --env

# インタラクティブモード
rtm login --interactive

# コマンドライン引数で指定
rtm login -u "your@email.com" -p "yourpassword" --save
```

### 3. ステータス確認

```bash
# ログイン状態を確認
rtm status

# 詳細情報を表示
rtm status --verbose
```

### 4. ログアウト

```bash
# セッションのみクリア
rtm logout

# 保存された認証情報も削除
rtm logout --clear-credentials
```

## 📖 使用方法

### コマンド一覧

| コマンド | 説明 | オプション |
|---------|-----|----------|
| `login` | Remember the Milkにログイン | `-u`, `-p`, `-s`, `-i`, `--env`, `--headless` |
| `logout` | ログアウト | `-c`, `-f` |
| `status` | ログイン状態確認 | `-v` |

### ログインオプション

```bash
rtm login [OPTIONS]

オプション:
  -u, --username   ユーザー名またはメールアドレス
  -p, --password   パスワード
  -s, --save       認証情報を保存する
  -i, --interactive インタラクティブモードで認証情報を入力
  --env            環境変数から認証情報を使用
  --headless       ヘッドレスモードで実行（デフォルト: true）
  --help           ヘルプを表示
```

### 環境変数

| 変数名 | 説明 | 例 |
|-------|-----|---|
| `RTM_USERNAME` | Remember the Milkのユーザー名 | `user@example.com` |
| `RTM_PASSWORD` | Remember the Milkのパスワード | `mypassword123` |

### 使用例

#### 基本的な使用例

```bash
# 環境変数を使用したログイン
export RTM_USERNAME="user@example.com"
export RTM_PASSWORD="mypassword"
rtm login --env

# 認証情報を保存してログイン
rtm login -u "user@example.com" -p "mypassword" --save

# 保存された認証情報でログイン
rtm login

# ログイン状態の詳細確認
rtm status --verbose
```

#### インタラクティブモード

```bash
rtm login --interactive
# → ユーザー名またはメールアドレス: user@example.com
# → パスワード: [入力非表示]
```

#### 一時的な環境変数使用

```bash
RTM_USERNAME="user@example.com" RTM_PASSWORD="pass" rtm login --env
```

## 🔧 設定

### 設定ファイルの場所

- **認証情報**: `~/.rtm/auth.json`（暗号化済み）
- **設定ファイル**: `~/.rtm/config.json`

### セキュリティ

- 認証情報はAES-GCM暗号化で保存
- 設定ファイルは適切な権限（600）で保護
- メモリ上の機密情報は使用後に適切にクリア

## 🐛 トラブルシューティング

### よくある問題

#### 1. Playwrightブラウザが見つからない

```bash
# エラー: browserType.launch: Executable doesn't exist
npx playwright install
```

#### 2. 認証エラー

```bash
# 認証情報を確認
rtm status --verbose

# 保存された認証情報をクリア
rtm logout --clear-credentials

# 再度ログインを試行
rtm login --interactive
```

#### 3. ネットワークエラー

```bash
# 詳細ログで確認
rtm login --env -v

# ヘッドレスモードを無効にして確認
rtm login --env --headless=false
```

#### 4. 権限エラー

```bash
# 設定ディレクトリの権限を確認
ls -la ~/.rtm/

# 権限を修正
chmod 700 ~/.rtm/
chmod 600 ~/.rtm/*
```

### ログレベル

```bash
# デバッグログを有効化
rtm login --env --log-level debug

# 詳細ログを表示
rtm login --env -v
```

## 🔐 セキュリティ

### 認証情報の保護

- **暗号化**: AES-GCM 256bitによる強力な暗号化
- **ファイル権限**: Unix系では600（所有者のみ読み書き可能）
- **メモリ保護**: 使用後の機密情報クリア

### 環境変数の注意事項

1. **シェル履歴**: パスワードをコマンドラインに直接入力しない
2. **プロセス一覧**: 環境変数は他のプロセスから見える可能性がある
3. **推奨方法**: `.bashrc`や`.zshrc`での永続的な設定

### セキュアな設定例

```bash
# ~/.bashrc または ~/.zshrc
export RTM_USERNAME="user@example.com"
export RTM_PASSWORD="$(security find-generic-password -a rtm -s rtm -w)"  # macOS Keychain
```

## 🧪 開発・テスト

### 開発環境のセットアップ

```bash
git clone https://github.com/nekowasabi/rtm-cli.git
cd rtm-cli

# 依存関係のインストール
npx playwright install

# テストの実行
deno task test

# 開発モードで実行
deno task dev --help
```

### テスト

```bash
# 全テストを実行
deno task test

# 特定のテストを実行
deno test tests/commands/login_test.ts --allow-all

# テストカバレッジ
deno task test:coverage
```

### ビルド

```bash
# 本番用バイナリのビルド
deno task build

# 開発用の実行
deno task dev status
```

## 📚 API仕様

### プロジェクト構造

```
rtm-cli/
├── src/
│   ├── main.ts              # CLIエントリポイント
│   ├── commands/            # コマンド実装
│   │   ├── login.ts         # ログインコマンド
│   │   ├── logout.ts        # ログアウトコマンド
│   │   └── status.ts        # ステータスコマンド
│   ├── core/                # コア機能
│   │   ├── auth.ts          # 認証管理
│   │   ├── browser.ts       # ブラウザ自動化
│   │   └── config.ts        # 設定管理
│   └── utils/               # ユーティリティ
│       ├── crypto.ts        # 暗号化機能
│       ├── env.ts           # 環境変数管理
│       ├── errors.ts        # エラー定義
│       └── logger.ts        # ログ機能
└── tests/                   # テスト
    ├── commands/
    ├── core/
    └── utils/
```

## 🤝 コントリビューション

### バグレポート

[GitHub Issues](https://github.com/nekowasabi/rtm-cli/issues)でバグを報告してください。

### 機能要望

新機能の提案は[GitHub Issues](https://github.com/nekowasabi/rtm-cli/issues)でお気軽にどうぞ。

### プルリクエスト

1. フォークしてブランチを作成
2. 変更を実装
3. テストを追加・実行
4. プルリクエストを作成

## 📄 ライセンス

[MIT License](LICENSE)

## 🙏 謝辞

- [Deno](https://deno.land/) - 安全なJavaScript/TypeScriptランタイム
- [Playwright](https://playwright.dev/) - ブラウザ自動化
- [Remember the Milk](https://www.rememberthemilk.com/) - タスク管理サービス

---

**注意**: このツールはRemember the Milk社の公式ツールではありません。使用は自己責任でお願いします。