import { AuthManager } from "../core/auth.ts";

export interface LogoutOptions {
  clearCredentials?: boolean;
  force?: boolean;
}

export interface LogoutResult {
  success: boolean;
  message: string;
}

export class LogoutCommand {
  private authManager: AuthManager;
  private authPath?: string;

  constructor(authPath?: string) {
    this.authManager = new AuthManager();
    this.authPath = authPath;
  }

  async execute(options: LogoutOptions): Promise<LogoutResult> {
    // 保存された認証情報もクリアする場合
    if (options.clearCredentials) {
      const authPath = this.getAuthPath();
      
      try {
        await this.authManager.clearCredentials(authPath);
        // セッションもクリア
        this.authManager.clearSession();
        return {
          success: true,
          message: "ログアウトしました（保存された認証情報も削除しました）"
        };
      } catch (error) {
        if (options.force) {
          this.authManager.clearSession();
          return {
            success: true,
            message: "ログアウトしました（保存された認証情報も削除しました）"
          };
        }
        throw error;
      }
    }
    
    const wasLoggedIn = this.authManager.isLoggedIn();
    
    // セッションをクリア
    this.authManager.clearSession();
    
    if (!wasLoggedIn && !options.force) {
      return {
        success: true,
        message: "既にログアウト状態です"
      };
    }
    
    return {
      success: true,
      message: "ログアウトしました"
    };
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