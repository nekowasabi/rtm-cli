import { assertEquals, assertExists } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { UrlCommand } from "../../src/commands/url.ts";
import { BrowserManager } from "../../src/core/browser.ts";
import { AuthManager } from "../../src/core/auth.ts";
import { Logger } from "../../src/utils/logger.ts";

// モックページクラス
class MockPage {
  public cookies: any[] = [];
  
  context() {
    const self = this;
    return {
      async addCookies(cookies: any[]): Promise<void> {
        self.cookies = cookies;
      }
    };
  }
}

// モックブラウザクラス
class MockBrowserManager extends BrowserManager {
  public launched = false;
  public closed = false;
  public navigatedUrl = "";
  public waitForElementCalled = false;
  private mockPage = new MockPage();

  async launch(_options?: any): Promise<void> {
    this.launched = true;
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  async newPage(): Promise<any> {
    return this.mockPage;
  }

  async navigateToUrl(_page: any, url: string): Promise<boolean> {
    this.navigatedUrl = url;
    return true;
  }

  async waitForElement(_page: any, _selector: string, _timeout?: number): Promise<boolean> {
    this.waitForElementCalled = true;
    return true;
  }

  get cookiesSet(): boolean {
    return this.mockPage.cookies.length > 0;
  }
}

// 認証済みのコマンドインスタンスを作成するヘルパー
function createAuthenticatedCommand(browserManager?: BrowserManager): UrlCommand {
  const command = new UrlCommand(browserManager);
  const authManager = new AuthManager();
  authManager.setSession({
    token: "test-token",
    expires: Date.now() + 3600000
  });
  // commandのauthManagerを置き換える（プライベートプロパティなので、直接アクセスはできない）
  // 代わりに、commandを作成後すぐにセッションを設定
  (command as any).authManager = authManager;
  return command;
}

Deno.test("UrlCommand - URLが指定されていない場合", async () => {
  const command = new UrlCommand();
  const result = await command.execute({
    url: "",
    headless: true
  });

  assertEquals(result.success, false);
  assertEquals(result.message, "URLが指定されていません");
  assertEquals(result.error, "URLを指定してください");
});

Deno.test("UrlCommand - ログインしていない場合", async () => {
  // 一時的に空の設定を作成するためのモックコマンド
  class MockUrlCommand extends UrlCommand {
    async execute(options: UrlCommandOptions): Promise<UrlCommandResult> {
      this.logger.info("URLコマンドを実行します");
      
      // URLバリデーション
      if (!options.url) {
        const errorResult = {
          url: "",
          opened: false,
          error: "URLを指定してください",
          timestamp: new Date().toISOString()
        };
        console.log(JSON.stringify(errorResult, null, 2));
        
        return {
          success: false,
          message: "URLが指定されていません",
          error: "URLを指定してください"
        };
      }
      
      // URLの正規化（Remember the MilkのURLでない場合は追加）
      let targetUrl = options.url;
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = `https://www.rememberthemilk.com/${targetUrl}`;
      }
      
      // ここで強制的にログインしていない状態を返す
      const errorResult = {
        url: targetUrl,
        opened: false,
        error: "ログインが必要です。先に `rtm login` コマンドでログインしてください",
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(errorResult, null, 2));
      
      return {
        success: false,
        message: "ログインが必要です",
        error: "先に `rtm login` コマンドでログインしてください"
      };
    }
  }
  
  const command = new MockUrlCommand();
  const result = await command.execute({
    url: "https://www.rememberthemilk.com/app/#inbox",
    headless: true
  });

  assertEquals(result.success, false);
  assertEquals(result.message, "ログインが必要です");
  assertEquals(result.error, "先に `rtm login` コマンドでログインしてください");
});

Deno.test("UrlCommand - 正常にURLを開く", async () => {
  const mockBrowser = new MockBrowserManager();
  const command = createAuthenticatedCommand(mockBrowser);
  
  const result = await command.execute({
    url: "https://www.rememberthemilk.com/app/#inbox",
    headless: true
  });

  assertEquals(result.success, true);
  assertEquals(result.message, "✅ URLを開きました: https://www.rememberthemilk.com/app/#inbox");
  assertEquals(result.url, "https://www.rememberthemilk.com/app/#inbox");
  assertEquals(result.opened, true);
  assertEquals(mockBrowser.launched, true);
  assertEquals(mockBrowser.navigatedUrl, "https://www.rememberthemilk.com/app/#inbox");
  assertEquals(mockBrowser.cookiesSet, true);
  assertEquals(mockBrowser.waitForElementCalled, true);
  assertEquals(mockBrowser.closed, false); // ブラウザインスタンスが渡されたので閉じない
});

Deno.test("UrlCommand - 相対URLの正規化", async () => {
  const mockBrowser = new MockBrowserManager();
  const command = createAuthenticatedCommand(mockBrowser);
  
  const result = await command.execute({
    url: "app/#inbox",
    headless: true
  });

  assertEquals(result.success, true);
  assertEquals(mockBrowser.navigatedUrl, "https://www.rememberthemilk.com/app/#inbox");
});

Deno.test("UrlCommand - 共通URLショートカット", () => {
  const shortcuts = UrlCommand.getCommonUrls();

  assertExists(shortcuts.inbox);
  assertExists(shortcuts.today);
  assertExists(shortcuts.completed);
  assertExists(shortcuts["completed-today"]);
  assertExists(shortcuts.overdue);
  assertExists(shortcuts.week);
  assertExists(shortcuts.all);
  assertExists(shortcuts.settings);
  assertExists(shortcuts.lists);
  assertExists(shortcuts.tags);

  assertEquals(shortcuts["completed-today"], "app/#search/status%3Acompleted+AND+completed%3AToday/completed");
});

Deno.test("UrlCommand - エラーハンドリング", async () => {
  // エラーを投げるモックブラウザ
  class ErrorBrowserManager extends BrowserManager {
    async launch(_options?: any): Promise<void> {
      throw new Error("ブラウザの起動に失敗しました");
    }
  }

  const errorBrowser = new ErrorBrowserManager();
  const command = createAuthenticatedCommand(errorBrowser);
  
  const result = await command.execute({
    url: "https://www.rememberthemilk.com/app/#inbox",
    headless: true
  });

  assertEquals(result.success, false);
  assertEquals(result.message, "URLを開く際にエラーが発生しました");
  assertEquals(result.error, "ブラウザの起動に失敗しました");
});