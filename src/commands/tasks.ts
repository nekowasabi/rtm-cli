import { BrowserManager } from "../core/browser.ts";
import { AuthManager } from "../core/auth.ts";
import { Config } from "../core/config.ts";
import { Logger } from "../utils/logger.ts";
import { RTMError } from "../utils/errors.ts";
import { LoginCommand } from "./login.ts";
import { EnvManager } from "../utils/env.ts";

export const tasksCommand = {
  name: "tasks",
  description: "指定されたリストのタスクを取得します。",
  action: async (options: { config: Config; listId: string; logger: Logger }) => {
    const { config, listId, logger } = options;
    const authManager = new AuthManager();

    // ログイン状態をチェックし、必要に応じて自動ログイン
    if (!config.cookies || config.cookies.length === 0) {
      logger.info("ログインしていません。自動ログインを試行します...");
      
      const envManager = new EnvManager();
      if (envManager.hasCompleteCredentials()) {
        logger.info("環境変数から認証情報を使用してログインします。");
        const loginCommand = new LoginCommand(undefined, logger);
        try {
          await loginCommand.executeWithEnvCredentials({ headless: true, logger });
          
          // 設定を再読み込み
          const { ConfigManager } = await import("../core/config.ts");
          const configManager = new ConfigManager();
          const configPath = `${Deno.env.get("HOME")}/.rtm/config.json`;
          const updatedConfig = await configManager.load(configPath);
          
          // 更新された設定を使用
          Object.assign(config, updatedConfig);
          
        } catch (error) {
          logger.error("自動ログインに失敗しました: " + (error instanceof Error ? error.message : String(error)));
          logger.error("手動でログインを実行してください: 'rtm login --env' または 'rtm login --interactive'");
          return;
        }
      } else {
        logger.error("ログインしていません。環境変数を設定するか、手動でログインしてください。");
        logger.error("環境変数: RTM_USERNAME, RTM_PASSWORD");
        logger.error("手動ログイン: 'rtm login --interactive'");
        return;
      }
    }

    const browserManager = new BrowserManager();
    try {
      logger.info("ブラウザを起動しています...");
      await browserManager.launch({ headless: config.headless });
      
      // Cookieを復元
      const page = await browserManager.newPage();
      if (config.cookies && config.cookies.length > 0) {
        await page.context().addCookies(config.cookies);
      }

      const listUrl = `https://www.rememberthemilk.com/app/#list/${listId}`;
      logger.info(`リストページに移動しています: ${listUrl}`);
      await browserManager.navigateToUrl(page, listUrl);

      // ページの読み込みと、主要なコンテナが表示されるのを待つ
      await page.waitForSelector("div.b-gN", { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      const tasks = await page.evaluate(() => {
        const taskElements = document.querySelectorAll('span.b-ib-dS-vQ');
        return Array.from(taskElements).map(el => el.textContent?.trim() || '');
      });

      if (tasks.length > 0) {
        logger.info(`${tasks.length}個のタスクが見つかりました！`);
        
        const uniqueTasks = [...new Set(tasks.filter(t => t))];
        
        const result = {
          listId: listId,
          taskCount: uniqueTasks.length,
          tasks: uniqueTasks,
        };
        
        console.log(JSON.stringify(result, null, 2));
        
      } else {
        logger.warn("指定された要素が見つかりませんでした。");
        const screenshotPath = "rtm-debug-screenshot.png";
        await browserManager.takeScreenshot(page, screenshotPath);
        logger.warn(`デバッグ用にスクリーンショットを ${screenshotPath} として保存しました。`);
        
        // 空の結果を返す
        const result = {
          listId: listId,
          taskCount: 0,
          tasks: []
        };
        console.log(JSON.stringify(result, null, 2));
      }

    } catch (error) {
      if (browserManager.isLaunched()) {
        const page = await browserManager.getActivePage();
        if (page) {
            const screenshotPath = "rtm-tasks-error.png";
            await browserManager.takeScreenshot(page, screenshotPath);
            logger.warn(`デバッグ用にスクリーンショットを ${screenshotPath} として保存しました。`);
            
            const htmlPath = "rtm-tasks-error.html";
            await Deno.writeTextFile(htmlPath, await page.content());
            logger.warn(`デバッグ用にHTMLを ${htmlPath} として保存しました。`);
        }
      }

      if (error instanceof RTMError) {
        logger.error(error.message);
      } else if (error instanceof Error) {
        logger.error(`予期せぬエラーが発生しました: ${error.message}`);
      } else {
        logger.error(`予期せぬエラーが発生しました: ${String(error)}`);
      }
    } finally {
      await browserManager.close();
      logger.info("ブラウザを終了しました。");
    }
  },
};
