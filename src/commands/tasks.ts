import { BrowserManager } from "../core/browser.ts";
import { AuthManager } from "../core/auth.ts";
import { Config } from "../core/config.ts";
import { Logger } from "../utils/logger.ts";
import { RTMError } from "../utils/errors.ts";
import { LoginCommand } from "./login.ts";
import { EnvManager } from "../utils/env.ts";

const logger = new Logger();

export const tasksCommand = {
  name: "tasks",
  description: "指定されたリストのタスクを取得します。",
  action: async (options: { config: Config; listId: string }) => {
    const { config, listId } = options;
    const authManager = new AuthManager();

    // ログイン状態をチェックし、必要に応じて自動ログイン
    if (!config.cookies || config.cookies.length === 0) {
      logger.info("ログインしていません。自動ログインを試行します...");
      
      const envManager = new EnvManager();
      if (envManager.hasCompleteCredentials()) {
        logger.info("環境変数から認証情報を使用してログインします。");
        const loginCommand = new LoginCommand();
        try {
          await loginCommand.executeWithEnvCredentials({ headless: true });
          
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

      // まず複数のセレクタでタスク要素を検索
      const possibleSelectors = [
        "div.b-BT-ib-KS",           // 元のセレクタ
        "span#b-ib-dS-vQ",          // ユーザー指定のセレクタ
        ".task-item",               // 一般的なタスクアイテム
        "[data-task-id]",           // タスクIDを持つ要素
        ".task-row",                // タスク行
        ".rtm-task",                // RTM固有のタスククラス
        ".task-name",               // タスク名要素
        ".task-title",              // タスクタイトル
        ".task-content",            // タスクコンテンツ
        "li[class*='task']",        // タスクを含むリストアイテム
        "div[class*='task']",       // タスクを含むdiv
        ".b-BT-ib-KS .task",        // 親要素内のタスク
        ".b-BT-ib-KS > *",          // 直接の子要素
        "span[id*='b-ib-dS']",      // 類似IDパターン
      ];

      let taskElements: any[] = [];
      let usedSelector = "";

      for (const selector of possibleSelectors) {
        try {
          logger.info(`セレクタ "${selector}" でタスク要素を検索中...`);
          const elements = await page.locator(selector).all();
          if (elements.length > 0) {
            taskElements = elements;
            usedSelector = selector;
            logger.info(`セレクタ "${selector}" で ${elements.length} 個の要素が見つかりました！`);
            break;
          }
        } catch (error) {
          // このセレクタでは見つからなかった
          continue;
        }
      }

      if (taskElements.length === 0) {
        logger.warn("どのセレクタでもタスク要素が見つかりませんでした。ページ構造を調査します...");
        
        // ページの構造をデバッグ出力
        const pageContent = await page.content();
        const lines = pageContent.split('\n');
        const relevantLines = lines.filter(line => 
          line.includes('task') || 
          line.includes('talestune') || 
          line.includes('sim') || 
          line.includes('メイン')
        );
        
        logger.info("関連するHTML構造:");
        for (const line of relevantLines.slice(0, 10)) {
          logger.info("  " + line.trim());
        }
        
        // 元のセレクタで再試行
        taskElements = await page.locator("div.b-BT-ib-KS").all();
        usedSelector = "div.b-BT-ib-KS";
      }
      
      if (taskElements.length > 0) {
        logger.info(`${taskElements.length}個のタスク要素が見つかりました！`);
        
        const tasks: string[] = [];
        
        for (let i = 0; i < taskElements.length; i++) {
          const element = taskElements[i];
          try {
            const taskText = await element.textContent({ timeout: 5000 });
            logger.info(`要素 ${i + 1}: "${taskText}"`);
            
            if (taskText && taskText.trim()) {
              // タスクテキストをクリーンアップ（改行や余分な空白を除去）
              const cleanText = taskText.trim().replace(/\s+/g, ' ');
              
              // パターンマッチングで個別タスクを検出
              // ユーザー要求に基づき、最初の2つのタスクのみを取得
              const taskPattern = /([^→]+→)/g;
              const matches = cleanText.match(taskPattern);
              
              if (matches && matches.length >= 2) {
                // 最初の2つのタスクのみを取得（ユーザー要求に基づく）
                logger.info(`複数のタスクを検出。最初の2つを取得します。`);
                
                // 最初のタスク
                const firstTask = matches[0].trim();
                tasks.push(firstTask);
                logger.info(`  - タスク1: "${firstTask}"`);
                
                // 2つ目以降を結合
                const remainingParts = matches.slice(1);
                const secondTask = remainingParts.join('').trim();
                if (secondTask && secondTask !== '→') {
                  tasks.push(secondTask);
                  logger.info(`  - タスク2: "${secondTask}"`);
                }
              } else if (matches && matches.length === 1) {
                // 1つのタスクのみ
                tasks.push(cleanText);
                logger.info(`  - 単一タスク: "${cleanText}"`);
              } else {
                // パターンにマッチしない場合はそのまま追加
                tasks.push(cleanText);
                logger.info(`  - そのまま追加: "${cleanText}"`);
              }
            }
          } catch (error) {
            logger.warn("一部のタスク要素の取得に失敗しました: " + (error instanceof Error ? error.message : String(error)));
          }
        }
        
        // 重複を除去
        const uniqueTasks = [...new Set(tasks)];
        
        // JSON配列として出力
        const result = {
          listId: listId,
          taskCount: uniqueTasks.length,
          tasks: uniqueTasks
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
        logger.error(`予期せぬエラーが発生しま��た: ${error.message}`);
      } else {
        logger.error(`予期せぬエラーが発生しました: ${String(error)}`);
      }
    } finally {
      await browserManager.close();
      logger.info("ブラウザを終了しました。");
    }
  },
};