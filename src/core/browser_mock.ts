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

// モック用のページインターフェース
export interface MockPage {
  url: string;
  title: string;
}

export class BrowserManagerMock {
  private launched: boolean = false;
  private timeout: number = 30000;
  private pages: MockPage[] = [];

  async launch(options: BrowserOptions): Promise<void> {
    this.launched = true;
    this.timeout = options.timeout ?? 30000;
  }

  async close(): Promise<void> {
    this.launched = false;
    this.pages = [];
  }

  isLaunched(): boolean {
    return this.launched;
  }

  getTimeout(): number {
    return this.timeout;
  }

  async newPage(): Promise<MockPage> {
    if (!this.launched) {
      throw new NetworkError("ブラウザが起動されていません");
    }
    
    const page: MockPage = {
      url: "about:blank",
      title: "New Page"
    };
    
    this.pages.push(page);
    return page;
  }

  async navigateToLogin(page: MockPage): Promise<boolean> {
    return await this.navigateToUrl(page, "https://www.rememberthemilk.com/login/");
  }

  async navigateToUrl(page: MockPage, url: string): Promise<boolean> {
    if (url.includes("nonexistent-domain")) {
      throw new NetworkError("ページの読み込みに失敗しました: DNS解決エラー");
    }
    
    page.url = url;
    page.title = url.includes("rememberthemilk.com") ? "Remember The Milk - Login" : "Page";
    return true;
  }

  async attemptLogin(page: MockPage, username: string, password: string): Promise<LoginResult> {
    // モック実装：特定の認証情報でのみ成功
    if (username === "invalid@example.com" && password === "wrongpassword") {
      return { success: false, error: "認証情報が正しくありません" };
    }
    
    // その他の場合は成功とする
    page.url = "https://www.rememberthemilk.com/app";
    page.title = "Remember The Milk - Tasks";
    return { success: true };
  }

  async extractSessionInfo(page: MockPage): Promise<SessionData> {
    if (!page.url.includes("/app")) {
      throw new NetworkError("ログインしていません");
    }
    
    return {
      token: "mock-session-token-" + Date.now(),
      expires: Date.now() + 3600000, // 1時間後
      loginTime: Date.now()
    };
  }

  async takeScreenshot(page: MockPage, path: string): Promise<void> {
    // モック実装：実際にはファイルを作成しない
    console.debug(`スクリーンショットを保存: ${path} (${page.url})`);
  }

  async waitForElement(page: MockPage, selector: string, timeout?: number): Promise<boolean> {
    // モック実装：常にtrueを返す
    return true;
  }

  async getPageTitle(page: MockPage): Promise<string> {
    return page.title;
  }
}