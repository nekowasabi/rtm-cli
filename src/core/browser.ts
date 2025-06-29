import { chromium, Browser, Page, BrowserContext } from "playwright";
import { NetworkError } from "../utils/errors.ts";
import { SessionData } from "./auth.ts";

export interface BrowserOptions {
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private timeout: number = 30000;

  async launch(options: BrowserOptions): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: options.headless ?? true,
      });
      
      this.context = await this.browser.newContext({
        userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      
      this.timeout = options.timeout ?? 30000;
      this.context.setDefaultTimeout(this.timeout);
      
    } catch (error) {
      throw new NetworkError(`ブラウザの起動に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      throw new NetworkError(`ブラウザの終了に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isLaunched(): boolean {
    return this.browser !== null && this.context !== null;
  }

  getTimeout(): number {
    return this.timeout;
  }

  async newPage(): Promise<Page> {
    if (!this.context) {
      throw new NetworkError("ブラウザが起動されていません");
    }
    
    try {
      return await this.context.newPage();
    } catch (error) {
      throw new NetworkError(`ページの作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async navigateToLogin(page: Page): Promise<boolean> {
    return await this.navigateToUrl(page, "https://www.rememberthemilk.com/login/");
  }

  async navigateToUrl(page: Page, url: string): Promise<boolean> {
    try {
      const response = await page.goto(url, { 
        timeout: this.timeout,
        waitUntil: 'domcontentloaded'
      });
      
      if (!response || response.status() >= 400) {
        throw new NetworkError(`ページの読み込みに失敗しました: HTTP ${response?.status()}`);
      }
      
      return true;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError(`ページの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async attemptLogin(page: Page, username: string, password: string): Promise<LoginResult> {
    try {
      await page.waitForSelector('input[name="username"]', { timeout: 10000 });
      await page.fill('input[name="username"]', username);
      
      await page.waitForSelector('input[name="password"]');
      await page.fill('input[name="password"]', password);
      
      await page.click('button[name="login"]');
      
      await page.waitForURL("https://www.rememberthemilk.com/app/", { timeout: 15000 });
      
      return { success: true };
    } catch (error) {
      const errorMessage = await page.locator('.rtm-message-error').first().textContent({ timeout: 1000 }).catch(() => null);
      if (errorMessage) {
        return { success: false, error: errorMessage };
      }
      
      if (page.url().startsWith("https://www.rememberthemilk.com/app/")) {
        return { success: true };
      }

      return { 
        success: false, 
        error: `ログイン処理でタイムアウトまたは予期せぬエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  async extractSessionInfo(page: Page): Promise<SessionData> {
    try {
      // モック実装：実際の実装では以下のような処理を行う
      
      // 実際の実装例（コメントアウト）:
      /*
      // Cookieからセッション情報を取得
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(cookie => 
        cookie.name === 'session' || cookie.name === 'auth_token'
      );
      
      if (!sessionCookie) {
        throw new Error("セッション情報が見つかりません");
      }
      
      // LocalStorageからトークン情報を取得
      const localStorage = await page.evaluate(() => {
        return {
          token: localStorage.getItem('auth_token'),
          expires: localStorage.getItem('token_expires')
        };
      });
      
      return {
        token: localStorage.token || sessionCookie.value,
        expires: localStorage.expires ? parseInt(localStorage.expires) : Date.now() + 3600000,
        loginTime: Date.now()
      };
      */
      
      // テスト用のモック実装
      return {
        token: "mock-session-token-" + Date.now(),
        expires: Date.now() + 3600000, // 1時間後
        loginTime: Date.now()
      };
      
    } catch (error) {
      throw new NetworkError(`セッション情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async takeScreenshot(page: Page, path: string): Promise<void> {
    try {
      await page.screenshot({ path, fullPage: true });
    } catch (error) {
      throw new NetworkError(`スクリーンショットの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async waitForElement(page: Page, selector: string, timeout?: number): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { timeout: timeout || this.timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getPageTitle(page: Page): Promise<string> {
    try {
      return await page.title();
    } catch (error) {
      throw new NetworkError(`ページタイトルの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getActivePage(): Promise<Page | null> {
    if (this.context) {
      const pages = this.context.pages();
      if (pages.length > 0) {
        return pages[0];
      }
    }
    return null;
  }
}