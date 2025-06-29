import { AuthManager, Credentials } from "../core/auth.ts";
import { AuthError } from "../utils/errors.ts";
import { EnvManager } from "../utils/env.ts";
import { Config, ConfigManager } from "../core/config.ts";
import { BrowserManager } from "../core/browser.ts";
import { Logger } from "../utils/logger.ts";
import { Cookie } from "playwright";

export interface LoginOptions {
  username?: string;
  password?: string;
  save?: boolean;
  headless?: boolean;
  logger: Logger;
}

export interface LoginResult {
  success: boolean;
  message: string;
}

export interface InteractiveInput {
  username: string;
  password: string;
}

export class LoginCommand {
  private authManager: AuthManager;
  private envManager: EnvManager;
  private authPath?: string;
  private sessionCookies: Cookie[] = [];
  private logger: Logger;

  constructor(authPath?: string, logger?: Logger) {
    this.authManager = new AuthManager();
    this.envManager = new EnvManager();
    this.authPath = authPath;
    this.logger = logger || new Logger();
  }

  async execute(options: LoginOptions): Promise<LoginResult> {
    this.logger = options.logger;
    if (!options.username || !options.password) {
      throw new AuthError("ユーザー名とパスワードが必要です");
    }

    // モックログイン（実際の実装ではPlaywrightを使用）
    const success = await this.performLogin(options.username, options.password, options.headless);
    
    if (!success) {
      throw new AuthError("ログインに失敗しました");
    }

    // セッション情報を設定
    this.authManager.setSession({
      token: "mock-token-" + Date.now(),
      expires: Date.now() + 3600000, // 1時間後
      loginTime: Date.now()
    });

    // セッション情報を設定ファイルに保存
    await this.saveSessionToConfig();

    // 認証情報の保存
    if (options.save) {
      const credentials = await Credentials.create(options.username, options.password);
      await this.authManager.saveCredentials(credentials, this.getAuthPath());
      return {
        success: true,
        message: "ログインに成功しました（認証情報を保存しました）"
      };
    }

    return {
      success: true,
      message: "ログインに成功しました"
    };
  }

  async executeWithStoredCredentials(options: { headless?: boolean, logger: Logger }): Promise<LoginResult> {
    this.logger = options.logger;
    const authPath = this.getAuthPath();
    
    if (!await this.authManager.hasStoredCredentials(authPath)) {
      throw new AuthError("保存された認証情報が見つかりません");
    }

    try {
      const credentials = await this.authManager.loadCredentials(authPath);
      
      // モックログイン（実際の実装では保存された認証情報を使用）
      const success = await this.performLogin(credentials.username, "stored-password", options.headless);
      
      if (!success) {
        throw new AuthError("保存された認証情報でのログインに失敗しました");
      }

      // セッション情報を設定
      this.authManager.setSession({
        token: "stored-token-" + Date.now(),
        expires: Date.now() + 3600000,
        loginTime: Date.now()
      });

      // セッション情報を設定ファイルに保存
      await this.saveSessionToConfig();

      return {
        success: true,
        message: "保存された認証情報でログインしました"
      };
    } catch (error) {
      if (error instanceof AuthError && error.message.includes("認証情報が見つかりません")) {
        throw new AuthError("保存された認証情報が見つかりません");
      }
      throw error;
    }
  }

  async executeWithEnvCredentials(options: { headless?: boolean, logger: Logger }): Promise<LoginResult> {
    this.logger = options.logger;
    if (!this.envManager.hasCompleteCredentials()) {
      throw new AuthError("環境変数に完全な認証情報が設定されていません");
    }

    const envCredentials = this.envManager.getCredentialsFromEnv();
    
    // モックログイン
    const success = await this.performLogin(envCredentials.username!, envCredentials.password!, options.headless);
    
    if (!success) {
      throw new AuthError("環境変数の認証情報でのログインに失敗しました");
    }

    // セッション情報を設定
    this.authManager.setSession({
      token: "env-token-" + Date.now(),
      expires: Date.now() + 3600000,
      loginTime: Date.now()
    });

    // セッション情報を設定ファイルに保存
    await this.saveSessionToConfig();

    return {
      success: true,
      message: "環境変数の認証情報でログインしました"
    };
  }

  async executeInteractive(input: InteractiveInput, options: { headless?: boolean, logger: Logger }): Promise<LoginResult> {
    return await this.execute({
      username: input.username,
      password: input.password,
      save: false,
      headless: options.headless,
      logger: options.logger,
    });
  }

  private async performLogin(username: string, password: string, headless?: boolean): Promise<boolean> {
    const browserManager = new BrowserManager();
    
    try {
      this.logger.info(`ログイン試行: ${username}, ヘッドレス: ${headless !== false}`);
      
      // ブラウザを��動
      await browserManager.launch({ headless: headless !== false });
      const page = await browserManager.newPage();
      
      // ログインページに移動
      await page.goto("https://www.rememberthemilk.com/login/");
      
      // ページの読み込み完了を待機
      await page.waitForSelector('#username', { timeout: 30000 });
      
      // ユーザー名とパスワードを入力
      await page.fill('#username', username);
      await page.fill('#password', password);
      
      // ログインボタンをクリック
      await page.click('#login-button');
      
      // ログイン成功の確認：アプリページにリダイレクトされるか、またはエラーメッセージがないかを確認
      try {
        // ログイン成功の場合、通常はダッシュボードやアプリページにリダイレクトされる
        await page.waitForURL(/.*rememberthemilk\.com\/app.*/, { timeout: 15000 });
        
        // セッションクッキーを取得
        const cookies = await page.context().cookies();
        this.sessionCookies = cookies.filter(cookie => 
          cookie.domain.includes('rememberthemilk.com')
        );
        
        this.logger.info(`ログイン成功！${this.sessionCookies.length}個のクッキーを取得しました��`);
        return true;
        
      } catch (timeoutError) {
        // ログイン失敗の可能性：エラーメッセージをチェック
        const errorElements = await page.locator('.alert-danger, .error, [class*="error"]').count();
        if (errorElements > 0) {
          this.logger.error("ログイン失敗：認証情報が正しくありません");
          return false;
        }
        
        // タイムアウトだが、現在のURLをチェック
        const currentUrl = page.url();
        if (currentUrl.includes('/app')) {
          // アプリページにいる場合はログイン成功
          const cookies = await page.context().cookies();
          this.sessionCookies = cookies.filter(cookie => 
            cookie.domain.includes('rememberthemilk.com')
          );
          this.logger.info(`ログイン成功！${this.sessionCookies.length}個のクッキーを取得しました。`);
          return true;
        }
        
        this.logger.error("ログイン失敗：予期しないページです");
        return false;
      }
      
    } catch (error) {
      this.logger.error(`ログイン中にエラーが発生しました: ${error}`);
      return false;
    } finally {
      await browserManager.close();
    }
  }

  private async saveSessionToConfig(): Promise<void> {
    try {
      const configManager = new ConfigManager();
      const configPath = `${Deno.env.get("HOME")}/.rtm/config.json`;
      
      // 既存の設定を読み込む（存在しない場合はデフォルト設定）
      let config: Config;
      try {
        config = await configManager.load(configPath);
      } catch {
        config = configManager.getDefault();
      }
      
      // 実際のセッションクッキーを設定
      if (this.sessionCookies.length > 0) {
        config.cookies = this.sessionCookies;
        this.logger.info(`${this.sessionCookies.length}個のクッキーを設定ファイルに保存しました。`);
      } else {
        this.logger.warn("保存するセッションクッキーがありません。");
        return;
      }
      
      // 設定ディレクトリを作成
      const configDir = `${Deno.env.get("HOME")}/.rtm`;
      try {
        await Deno.mkdir(configDir, { recursive: true });
      } catch {
        // ディレクトリが既に存在する場合は無視
      }
      
      // 設定ファイルを保存
      await configManager.save(config, configPath);
    } catch (error) {
      this.logger.warn(`セッション情報の保存に失敗しました: ${error}`);
    }
  }

  private getAuthPath(): string {
    // テスト用のパスが指定されている場合はそれを使用
    if (this.authPath) {
      return this.authPath;
    }
    // 実際の実装では設定から取得
    return `${Deno.env.get("HOME")}/.rtm/auth.json`;
  }
}