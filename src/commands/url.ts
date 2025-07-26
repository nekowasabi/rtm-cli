import { BrowserManager } from "../core/browser.ts";
import { Logger } from "../utils/logger.ts";
import { AuthManager } from "../core/auth.ts";
import { Config, ConfigManager } from "../core/config.ts";

export interface UrlCommandOptions {
  url: string;
  headless?: boolean;
  logger?: Logger;
  extractTasks?: boolean;  // タスクを抽出するかどうか
}

export interface UrlCommandResult {
  success: boolean;
  message: string;
  error?: string;
  url?: string;
  opened?: boolean;
}

export class UrlCommand {
  private browserManager?: BrowserManager;
  private logger: Logger;
  private authManager: AuthManager;

  constructor(browserManager?: BrowserManager, logger?: Logger) {
    this.browserManager = browserManager;
    this.logger = logger || new Logger();
    this.authManager = new AuthManager();
  }

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
      // RTMのベースURLを使用
      targetUrl = `https://www.rememberthemilk.com/${targetUrl}`;
    }

    // 設定ファイルからセッション（クッキー）を読み込む
    const configManager = new ConfigManager();
    const configPath = Deno.env.get("HOME") + "/.rtm/config.json";
    
    let config: Config;
    try {
      config = await configManager.load(configPath);
    } catch {
      // 設定ファイルが存在しない場合はデフォルト設定を使用
      config = configManager.getDefault();
    }

    // セッションの確認
    if (!config.cookies || config.cookies.length === 0) {
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

    const headless = options.headless !== false;
    const browserInstance = this.browserManager || new BrowserManager();

    try {
      this.logger.info(`指定されたURLを開きます: ${targetUrl}`);
      
      // ブラウザを起動
      await browserInstance.launch({ headless });

      // 新しいページを作成
      const page = await browserInstance.newPage();

      // 保存されたクッキーを設定
      if (config.cookies && config.cookies.length > 0) {
        await page.context().addCookies(config.cookies);
        this.logger.info(`${config.cookies.length}個のクッキーを設定しました`);
      }

      // URLに移動
      await browserInstance.navigateToUrl(page, targetUrl);

      // ページが読み込まれるまで待機
      await browserInstance.waitForElement(page, ".content", 10000).catch(() => {});

      this.logger.info("URLが正常に開かれました");

      // タスクを抽出する場合
      let tasks: string[] = [];
      if (options.extractTasks !== false) {  // デフォルトでタスク抽出を行う
        try {
          // ページの読み込みが完了するまで待機
          await page.waitForLoadState('networkidle');
          
          // タスク要素が表示されるまで待機（最大10秒）
          await page.waitForSelector("span.b-ib-dS-vQ", { timeout: 10000 }).catch(() => {
            this.logger.warn("タスク要素が見つかりませんでした");
          });
          
          // タスクを取得
          tasks = await page.evaluate(() => {
            const taskElements = document.querySelectorAll('span.b-ib-dS-vQ');
            return Array.from(taskElements).map(el => el.textContent?.trim() || '');
          });
          
          if (tasks.length > 0) {
            this.logger.info(`${tasks.length}個のタスクが見つかりました`);
            tasks = [...new Set(tasks.filter(t => t))]; // 重複を除去
          }
        } catch (error) {
          this.logger.warn(`タスクの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // ヘッドレスモードでない場合は、ユーザーが操作できるように待機
      if (!headless) {
        console.log("\n📌 ブラウザで操作してください。終了するには Ctrl+C を押してください。");
        
        // Ctrl+Cが押されるまで待機
        const abortController = new AbortController();
        Deno.addSignalListener("SIGINT", () => {
          abortController.abort();
        });

        try {
          await new Promise((_, reject) => {
            abortController.signal.addEventListener("abort", () => {
              reject(new Error("ユーザーによって終了されました"));
            });
          });
        } catch (error) {
          if (error instanceof Error && error.message === "ユーザーによって終了されました") {
            this.logger.info("ユーザーによって終了されました");
          } else {
            throw error;
          }
        }
      }

      // JSON形式で結果を出力
      const result = {
        url: targetUrl,
        opened: true,
        headless: headless,
        taskCount: tasks.length,
        tasks: tasks,
        timestamp: new Date().toISOString()
      };
      
      console.log(JSON.stringify(result, null, 2));
      
      return {
        success: true,
        message: `✅ URLを開きました: ${targetUrl}`,
        url: targetUrl,
        opened: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`URL開く際にエラーが発生しました: ${errorMessage}`);
      
      const errorResult = {
        url: targetUrl,
        opened: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(errorResult, null, 2));
      
      return {
        success: false,
        message: "URLを開く際にエラーが発生しました",
        error: errorMessage
      };
    } finally {
      if (!this.browserManager) {
        await browserInstance.close();
      }
    }
  }

  /**
   * よく使うRTMのURLパターンを生成
   */
  static getCommonUrls(): Record<string, string> {
    return {
      inbox: "app/#inbox",
      today: "app/#search/status%3Aincomplete+AND+dueBefore%3Atomorrow",
      completed: "app/#search/status%3Acompleted",
      "completed-today": "app/#search/status%3Acompleted+AND+completed%3AToday/completed",
      overdue: "app/#search/status%3Aincomplete+AND+dueBefore%3Atoday",
      week: "app/#search/status%3Aincomplete+AND+dueWithin%3A%221+week+of+today%22",
      all: "app/#all",
      settings: "app/#settings",
      lists: "app/#lists",
      tags: "app/#search/tag%3A%2A"
    };
  }
}