import { LoginCommand } from "./commands/login.ts";
import { LogoutCommand } from "./commands/logout.ts";
import { StatusCommand } from "./commands/status.ts";
import { tasksCommand } from "./commands/tasks.ts";
import { UrlCommand } from "./commands/url.ts";
import { Logger, LogLevel } from "./utils/logger.ts";
import { EnvManager } from "./utils/env.ts";
import { Config, ConfigManager } from "./core/config.ts";

const logger = new Logger();

// 認証が必要なコマンドの前に自動ログインを試行
async function ensureAuthenticated(options: { headless?: boolean }): Promise<boolean> {
  const configManager = new ConfigManager();
  const configPath = Deno.env.get("HOME") + "/.rtm/config.json";

  // 既存のセッション（クッキー）をチェック
  try {
    const config = await configManager.load(configPath);
    if (config.cookies && config.cookies.length > 0) {
      logger.debug("既存のセッションクッキーが見つかりました");
      return true;
    }
  } catch {
    // 設定ファイルが存在しない場合は続行
  }

  // 環境変数が設定されている場合は自動ログイン
  const envManager = new EnvManager();
  if (envManager.hasCompleteCredentials()) {
    logger.info("セッションが無効です。環境変数から自動ログインを試行します...");
    const loginCommand = new LoginCommand(undefined, logger);
    try {
      const result = await loginCommand.executeWithEnvCredentials({
        headless: options.headless !== false,
        logger
      });
      console.log(result.message);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`自動ログインに失敗しました: ${errorMessage}`);
      return false;
    }
  }

  return false;
}

// シンプルなCLI引数パーサー
function parseArgs(args: string[]): { command?: string; subcommand?: string; options: Record<string, any> } {
  const options: Record<string, any> = {};
  let command: string | undefined;
  let subcommand: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (key === "help" || key === "debug") {
        options[key] = true;
      } else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options[key] = args[++i];
      } else {
        options[key] = true;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options[key] = args[++i];
      } else {
        options[key] = true;
      }
    } else if (!command) {
      command = arg;
    } else if (!subcommand && (command === "tasks" || command === "url")) {
      subcommand = arg; // tasks/url コマンドの場合、次の引数をサブコマンドとして扱う
    }
  }
  
  return { command, subcommand, options };
}

function showHelp(command?: string) {
  if (!command) {
    console.log("🥛 Remember the Milk CLI ツール");
    console.log("使用方法: rtm <command> [options]");
    console.log("\nコマンド:");
    console.log("  login    Remember the Milkにログイン");
    console.log("  logout   Remember the Milkからログアウト");
    console.log("  status   ログイン状態を確認");
    console.log("  tasks    指定されたリストのタスクを取得");
    console.log("  url      指定されたURLまたはビューを開く");
    console.log("\nオプション:");
    console.log("  --help   ヘルプを表示");
    console.log("  -v       詳細ログを出力");
    console.log("\n詳細なヘルプ: rtm <command> --help");
    console.log("\n環境変数:");
    console.log("  RTM_USERNAME   Remember the Milkのユーザー名");
    console.log("  RTM_PASSWORD   Remember the Milkのパスワード");
  } else {
    switch (command) {
      case "login":
        console.log("Remember the Milkにログイン");
        console.log("使用方法: rtm login [options]");
        console.log("\nオプション:");
        console.log("  -u, --username   ユーザー名またはメールアドレス");
        console.log("  -p, --password   パスワード");
        console.log("  -s, --save       認証情報を保存");
        console.log("  -i, --interactive インタラクティブモード");
        console.log("  --headless       ヘッドレスモード（デフォルト: true）");
        console.log("  --env            環境変数から認証情報を使用");
        console.log("\n環境変数:");
        console.log("  RTM_USERNAME     ユーザー名（--envオプション使用時）");
        console.log("  RTM_PASSWORD     パスワード（--envオプション使用時）");
        break;
      case "logout":
        console.log("Remember the Milkからログアウト");
        console.log("使用方法: rtm logout [options]");
        console.log("\nオプション:");
        console.log("  -c, --clear-credentials 保存された認証情報も削除");
        console.log("  -f, --force             強制的にログアウト");
        break;
      case "status":
        console.log("ログイン状態を確認");
        console.log("使用方法: rtm status [options]");
        console.log("\nオプション:");
        console.log("  -v, --verbose   詳細情報を表示");
        break;
      case "tasks":
        console.log("指定されたリストのタスクを取得");
        console.log("使用方法: rtm tasks <list-id> [options]");
        console.log("\n例:");
        console.log("  rtm tasks 1375005");
        console.log("\nオプション:");
        console.log("  --headless       ヘッドレスモード（デフォルト: true）");
        break;
      case "url":
        console.log("指定されたURLまたはビューを開く");
        console.log("使用方法: rtm url <url|view> [options]");
        console.log("\n例:");
        console.log("  rtm url https://www.rememberthemilk.com/app/#search/status%3Acompleted+AND+completed%3AToday/completed");
        console.log("  rtm url app/#inbox");
        console.log("  rtm url completed-today");
        console.log("\n利用可能なショートカット:");
        console.log("  inbox            受信箱");
        console.log("  today            今日のタスク");
        console.log("  completed        完了済みタスク");
        console.log("  completed-today  今日完了したタスク");
        console.log("  overdue          期限切れタスク");
        console.log("  week             今週のタスク");
        console.log("  all              全てのタスク");
        console.log("  settings         設定");
        console.log("  lists            リスト");
        console.log("  tags             タグ");
        console.log("\nオプション:");
        console.log("  --headless       ヘッドレスモード（デフォルト: true）");
        break;
      default:
        console.log(`不明なコマンド: ${command}`);
        showHelp();
    }
  }
}

async function handleLoginCommand(options: Record<string, any>) {
  const command = new LoginCommand(undefined, logger);
  const envManager = new EnvManager();

  try {
    const interactive = options.i || options.interactive;
    const useEnv = options.env;
    const username = options.u || options.username;
    const password = options.p || options.password;
    const save = options.s || options.save || false;
    const headless = options.headless !== false; // デフォルトtrue

    let result;

    if (useEnv) {
      // 明示的に環境変数から認証情報を使用
      result = await command.executeWithEnvCredentials({ headless, logger });
    } else if (username && password) {
      // コマンドライン引数から認証情報を使用
      result = await command.execute({
        username,
        password,
        save,
        headless,
        logger,
      });
    } else if (envManager.hasCompleteCredentials() && !interactive) {
      // 環境変数が設定されている場合は自動的に使用（インタラクティブモードでない場合）
      logger.info("環境変数から認証情報を使用します");
      result = await command.executeWithEnvCredentials({ headless, logger });
    } else if (interactive || (!username && !password)) {
      // インタラクティブモード
      const envCredentials = envManager.getCredentialsFromEnv();
      const defaultUsername = envCredentials.username || "";
      const defaultPassword = envCredentials.password || "";

      // ユーザー名入力
      const usernamePrompt = defaultUsername
        ? `ユーザー名またはメールアドレス (${defaultUsername}): `
        : "ユーザー名またはメールアドレス: ";
      const usernameInput = prompt(usernamePrompt);

      // null = キャンセル、空文字 = Enter押下
      const finalUsername = usernameInput === null
        ? defaultUsername  // キャンセル時はデフォルト使用
        : (usernameInput.trim() || defaultUsername);  // 空入力もデフォルト使用

      if (!finalUsername) {
        logger.error("ユーザー名が入力されていません。");
        Deno.exit(1);
      }

      // パスワード入力
      const passwordPrompt = defaultPassword
        ? "パスワード (設定済み): "
        : "パスワード: ";
      const passwordInput = prompt(passwordPrompt);

      const finalPassword = passwordInput === null
        ? defaultPassword
        : (passwordInput.trim() || defaultPassword);

      if (!finalPassword) {
        logger.error("パスワードが入力されていません。環境変数 RTM_PASSWORD を設定するか、-p オプションで指定してください。");
        Deno.exit(1);
      }

      result = await command.executeInteractive(
        { username: finalUsername, password: finalPassword },
        { headless, logger }
      );
    } else {
      // 保存された認証情報を使用
      result = await command.executeWithStoredCredentials({ headless, logger });
    }

    console.log(result.message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    console.error(`❌ ${errorMessage}`);
    Deno.exit(1);
  }
}

async function handleLogoutCommand(options: Record<string, any>) {
  const command = new LogoutCommand();
  
  try {
    const clearCredentials = options.c || options["clear-credentials"] || false;
    const force = options.f || options.force || false;
    
    const result = await command.execute({
      clearCredentials,
      force
    });
    
    console.log(result.message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    console.error(`❌ ${errorMessage}`);
    Deno.exit(1);
  }
}

async function handleStatusCommand(options: Record<string, any>) {
  const command = new StatusCommand(undefined, logger);
  
  try {
    const verbose = options.v || options.verbose || false;
    
    const result = await command.execute({ verbose, logger });
    
    console.log(result.message);
    
    if (verbose && result.details) {
      console.log("\n📊 詳細情報:");
      
      if (result.details.username) {
        console.log(`   ユーザー: ${result.details.username}`);
      }
      
      if (result.details.session) {
        console.log(`   セッション: ${result.details.session.token}`);
        console.log(`   有効期限: ${result.details.session.expiresAt}`);
        if (result.details.session.loginTime) {
          console.log(`   ログイン時刻: ${result.details.session.loginTime}`);
        }
      }
      
      if (result.details.hasStoredCredentials !== undefined) {
        console.log(`   認証情報保存: ${result.details.hasStoredCredentials ? "あり" : "なし"}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    console.error(`❌ ${errorMessage}`);
    Deno.exit(1);
  }
}

async function handleUrlCommand(urlOrView: string, options: Record<string, any>) {
  if (!urlOrView) {
    console.error("URLまたはビュー名が必要です。");
    console.error("使用方法: rtm url <url|view>");
    console.error("例: rtm url completed-today");
    console.error("例: rtm url app/#inbox");
    console.error("ヘルプ: rtm url --help");
    Deno.exit(1);
  }

  const headless = options.headless !== false; // デフォルトtrue

  // 自動ログインを試行
  await ensureAuthenticated({ headless });

  const command = new UrlCommand(undefined, logger);

  try {
    // ショートカットをチェック
    const shortcuts = UrlCommand.getCommonUrls();
    const targetUrl = shortcuts[urlOrView] || urlOrView;

    const result = await command.execute({
      url: targetUrl,
      headless,
      logger
    });

    if (!result.success) {
      Deno.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    console.error(`❌ ${errorMessage}`);
    Deno.exit(1);
  }
}

async function handleTasksCommand(listId: string, options: Record<string, any>) {
  if (!listId) {
    console.error("リストIDが必要です。");
    console.error("使用方法: rtm tasks <list-id>");
    console.error("例: rtm tasks 1375005");
    Deno.exit(1);
  }

  const headless = options.headless !== false; // デフォルトtrue

  // 自動ログインを試行
  await ensureAuthenticated({ headless });

  try {
    const configManager = new ConfigManager();
    const configPath = Deno.env.get("HOME") + "/.rtm/config.json";

    let config: Config;
    try {
      config = await configManager.load(configPath);
    } catch {
      // 設定ファイルが存在しない場合はデフォルト設定を使用
      config = configManager.getDefault();
    }

    await tasksCommand.action({
      config,
      listId,
      logger,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    console.error(`❌ ${errorMessage}`);
    Deno.exit(1);
  }
}

// メイン処理
if (import.meta.main) {
  try {
    const { command, subcommand, options } = parseArgs(Deno.args);
    
    // ログレベルの設定
    if (options.debug || options.v || options.verbose) {
      logger.setLevel(LogLevel.DEBUG);
    } else {
      logger.setLevel(LogLevel.WARN);
    }
    
    if (options.help) {
      showHelp(command);
      Deno.exit(0);
    }
    
    switch (command) {
      case "login":
        await handleLoginCommand(options);
        break;
      case "logout":
        await handleLogoutCommand(options);
        break;
      case "status":
        await handleStatusCommand(options);
        break;
      case "tasks":
        await handleTasksCommand(subcommand || "", options);
        break;
      case "url":
        await handleUrlCommand(subcommand || "", options);
        break;
      default:
        showHelp();
        if (command) {
          console.error(`\n❌ 不明なコマンド: ${command}`);
          Deno.exit(1);
        }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`CLI実行エラー: ${errorMessage}`);
    console.error(`❌ エラーが発生しました: ${errorMessage}`);
    Deno.exit(1);
  }
}