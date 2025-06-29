import { LoginCommand } from "./commands/login.ts";
import { LogoutCommand } from "./commands/logout.ts";
import { StatusCommand } from "./commands/status.ts";
import { tasksCommand } from "./commands/tasks.ts";
import { Logger, LogLevel } from "./utils/logger.ts";
import { EnvManager } from "./utils/env.ts";
import { Config, ConfigManager } from "./core/config.ts";

const logger = new Logger();

// シンプルなCLI引数パーサー
function parseArgs(args: string[]): { command?: string; subcommand?: string; options: Record<string, any> } {
  const options: Record<string, any> = {};
  let command: string | undefined;
  let subcommand: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (key === "help") {
        options.help = true;
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
    } else if (!subcommand && command === "tasks") {
      subcommand = arg; // tasks コマンドの場合、次の引数をサブコマンド（リストID）として扱う
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
      default:
        console.log(`不明なコマンド: ${command}`);
        showHelp();
    }
  }
}

async function handleLoginCommand(options: Record<string, any>) {
  const command = new LoginCommand();
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
      // 環境変数から認証情報を使用
      result = await command.executeWithEnvCredentials({ headless });
    } else if (interactive || (!username && !password)) {
      // インタラクティブモード
      console.log("Remember the Milkにログインします。");
      
      // 環境変数が設定されている場合はデフォルト値として使用
      const envCredentials = envManager.getCredentialsFromEnv();
      const defaultUsername = envCredentials.username || "";
      const defaultPassword = envCredentials.password || "";
      
      const usernameInput = prompt(`ユーザー名またはメールアドレス${defaultUsername ? ` (${defaultUsername})` : ""}: `) || defaultUsername;
      const passwordInput = prompt(`パスワード${defaultPassword ? " (設定済み)" : ""}: `) || defaultPassword;
      
      if (!usernameInput || !passwordInput) {
        console.error("ユーザー名とパスワードが必要です。");
        Deno.exit(1);
      }
      
      result = await command.executeInteractive({
        username: usernameInput,
        password: passwordInput
      }, { headless });
    } else if (username && password) {
      // コマンドライン引数から認証情報を使用
      result = await command.execute({
        username,
        password,
        save,
        headless
      });
    } else {
      // 保存された認証情報を使用
      result = await command.executeWithStoredCredentials({ headless });
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
  const command = new StatusCommand();
  
  try {
    const verbose = options.v || options.verbose || false;
    
    const result = await command.execute({ verbose });
    
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

async function handleTasksCommand(listId: string, options: Record<string, any>) {
  if (!listId) {
    console.error("❌ リストIDが必要です。");
    console.error("使用方法: rtm tasks <list-id>");
    console.error("例: rtm tasks 1375005");
    Deno.exit(1);
  }
  
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
    
    const headless = options.headless !== false; // デフォルトtrue
    
    await tasksCommand.action({
      config,
      listId
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
    if (options.v || options.verbose) {
      logger.setLevel(LogLevel.DEBUG);
    } else {
      const logLevel = options["log-level"] || "info";
      switch (logLevel) {
        case "debug":
          logger.setLevel(LogLevel.DEBUG);
          break;
        case "info":
          logger.setLevel(LogLevel.INFO);
          break;
        case "warn":
          logger.setLevel(LogLevel.WARN);
          break;
        case "error":
          logger.setLevel(LogLevel.ERROR);
          break;
        default:
          logger.setLevel(LogLevel.INFO);
      }
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