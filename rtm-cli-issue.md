# Remember the Milk CLI Tool 作成プロジェクト

## 概要

Deno + gunshi + Playwright を使用して、Remember the Milk にログインするCLIツールを作成する。

## 目標

- Remember the Milk への自動ログイン機能
- コマンドライン操作による簡単なアクセス
- セキュアな認証情報の管理
- 再利用可能なセッション管理

## 技術スタック

- **Runtime**: Deno
- **CLI Framework**: gunshi (@kazupon/gunshi)
- **Browser Automation**: Playwright
- **Language**: TypeScript

## 作成手順

### Phase 1: プロジェクト初期化

- [ ] Denoプロジェクトの初期化
- [ ] 必要な依存関係の設定
  - gunshi
  - playwright
  - TypeScript型定義
- [ ] プロジェクト構造の作成
- [ ] 基本的なCLI設定

### Phase 2: 基本CLI構造の実装

- [ ] gunshiを使用したCLIコマンドの定義
- [ ] 基本的なコマンド構造の実装
  - `rtm login` - ログインコマンド
  - `rtm logout` - ログアウトコマンド
  - `rtm status` - ログイン状態確認
- [ ] ヘルプメッセージとバージョン情報の設定

### Phase 3: 認証情報管理

- [ ] 設定ファイルの保存場所の決定
- [ ] 認証情報の暗号化・復号化機能
- [ ] セキュアな認証情報の保存・読み込み
- [ ] セッション管理機能

### Phase 4: Playwright統合

- [ ] Playwrightの初期化とブラウザ設定
- [ ] Remember the Milkログインページの分析
  - ログインフォームの要素特定
  - JavaScriptによる動的読み込みへの対応
  - 第三者認証（Google/Facebook/Apple）の対応検討
- [ ] 自動ログイン機能の実装
- [ ] ログイン成功/失敗の判定ロジック
- [ ] セッション情報の取得と保存

### Phase 5: エラーハンドリングとロバスト性

- [ ] ネットワークエラーの処理
- [ ] 認証失敗時の処理
- [ ] ページ読み込みタイムアウトの処理
- [ ] 適切なエラーメッセージの表示
- [ ] ログ機能の実装

### Phase 6: ユーザーエクスペリエンス向上

- [ ] インタラクティブなログイン（ユーザー名・パスワード入力）
- [ ] プログレスバーやスピナーの実装
- [ ] 詳細ログの切り替え（verbose mode）
- [ ] ドライランモードの実装

### Phase 7: テストとデバッグ

- [ ] 単体テストの作成
- [ ] 統合テストの作成
- [ ] エラーケースのテスト
- [ ] CI/CDパイプラインの設定

### Phase 8: ドキュメント作成

- [ ] README.mdの作成
- [ ] インストール手順の記載
- [ ] 使用方法の説明
- [ ] トラブルシューティングガイド
- [ ] セキュリティに関する注意事項

## 技術的な考慮点

### Playwright統合の注意点

1. **ブラウザの設定**
   - ヘッドレスモードでの実行
   - User-Agentの設定
   - 必要に応じてブラウザウィンドウの表示

2. **Remember the Milk特有の要素**
   - 動的なJavaScript読み込みの処理
   - CSRF対策の考慮
   - 第三者認証システムへの対応

3. **セッション管理**
   - Cookieの保存と再利用
   - セッション有効期限の管理
   - 複数アカウントへの対応

### セキュリティ考慮事項

1. **認証情報の保護**
   - パスワードの暗号化保存
   - 設定ファイルの適切な権限設定
   - メモリ上の機密情報の適切な消去

2. **ブラウザセキュリティ**
   - 安全なブラウザプロファイルの使用
   - 不要な拡張機能の無効化
   - セキュアな通信の確保

### gunshi設計パターンの活用

1. **コマンド定義**
   ```typescript
   const loginCommand = define({
     name: 'login',
     description: 'Login to Remember the Milk',
     args: {
       username: {
         type: 'string',
         short: 'u',
         description: 'Username or email'
       },
       password: {
         type: 'string',
         short: 'p',
         description: 'Password'
       },
       save: {
         type: 'boolean',
         short: 's',
         description: 'Save credentials'
       }
     },
     run: async (ctx) => {
       // ログイン処理の実装
     }
   })
   ```

2. **遅延ローディング**
   ```typescript
   const browserCommand = lazy(async () => {
     const { chromium } = await import('playwright')
     return async (ctx) => {
       // ブラウザ操作の実装
     }
   }, {
     name: 'browser',
     description: 'Browser automation commands'
   })
   ```

## ファイル構造案

```
rtm-cli/
├── deno.json
├── README.md
├── src/
│   ├── main.ts              # エントリポイント
│   ├── commands/
│   │   ├── login.ts         # ログインコマンド
│   │   ├── logout.ts        # ログアウトコマンド
│   │   └── status.ts        # ステータスコマンド
│   ├── core/
│   │   ├── browser.ts       # Playwright操作
│   │   ├── auth.ts          # 認証処理
│   │   └── config.ts        # 設定管理
│   └── utils/
│       ├── crypto.ts        # 暗号化機能
│       ├── logger.ts        # ログ機能
│       └── errors.ts        # エラー定義
├── tests/
│   ├── commands/
│   ├── core/
│   └── utils/
└── docs/
    ├── installation.md
    ├── usage.md
    └── troubleshooting.md
```

## 成功指標

- [ ] CLIツールが正常にビルド・実行される
- [ ] Remember the Milkへの自動ログインが成功する
- [ ] セッション情報が適切に保存・再利用される
- [ ] エラー処理が適切に動作する
- [ ] セキュリティ要件が満たされる
- [ ] ドキュメントが完備される

## リスク要因

1. **Remember the Milk側の仕様変更**
   - ログインページの構造変更
   - 新しいセキュリティ対策の導入
   - API仕様の変更

2. **依存関係の更新**
   - Playwright APIの変更
   - gunshiライブラリの更新
   - Denoランタイムの変更

3. **セキュリティリスク**
   - 認証情報の漏洩
   - 中間者攻撃への対策
   - ローカルストレージのセキュリティ

## 次のステップ

1. プロジェクト初期化の実行
2. 基本的なCLI構造の実装開始
3. Remember the Milkログインページの詳細分析
4. 最小限の動作するプロトタイプの作成