import { AuthManager, SessionData } from "../core/auth.ts";

export interface StatusOptions {
  verbose?: boolean;
  // テスト用のモックオプション
  mockLoggedIn?: boolean;
  mockUser?: string;
  mockSession?: SessionData;
  mockStoredCredentials?: boolean;
}

export interface StatusResult {
  isLoggedIn: boolean;
  message: string;
  details?: {
    username?: string;
    session?: {
      token: string;
      expiresAt: string;
      loginTime?: string;
    };
    hasStoredCredentials?: boolean;
  };
}

export class StatusCommand {
  private authManager: AuthManager;
  private authPath?: string;

  constructor(authPath?: string) {
    this.authManager = new AuthManager();
    this.authPath = authPath;
  }

  async execute(options: StatusOptions): Promise<StatusResult> {
    // テスト用のモック処理
    if (options.mockLoggedIn !== undefined) {
      return await this.executeMock(options);
    }

    const isLoggedIn = this.authManager.isLoggedIn();
    const session = this.authManager.getSession();
    
    if (!options.verbose) {
      return {
        isLoggedIn,
        message: isLoggedIn ? `ログイン中` : "ログアウト状態"
      };
    }

    // 詳細情報の収集
    const details: StatusResult["details"] = {};
    
    if (isLoggedIn && session) {
      details.session = {
        token: this.maskToken(session.token),
        expiresAt: new Date(session.expires).toISOString(),
        loginTime: session.loginTime ? new Date(session.loginTime).toISOString() : undefined
      };
    }

    // 保存された認証情報の確認
    const authPath = this.getAuthPath();
    details.hasStoredCredentials = await this.authManager.hasStoredCredentials(authPath);

    return {
      isLoggedIn,
      message: isLoggedIn ? "ログイン中" : "ログアウト状態",
      details
    };
  }

  private async executeMock(options: StatusOptions): Promise<StatusResult> {
    const isLoggedIn = options.mockLoggedIn || false;
    const username = options.mockUser;
    
    if (!options.verbose) {
      return {
        isLoggedIn,
        message: isLoggedIn && username ? `ログイン中 (${username})` : "ログアウト状態"
      };
    }

    const details: StatusResult["details"] = {};
    
    if (username) {
      details.username = username;
    }
    
    if (options.mockSession) {
      details.session = {
        token: this.maskToken(options.mockSession.token),
        expiresAt: new Date(options.mockSession.expires).toISOString(),
        loginTime: options.mockSession.loginTime ? new Date(options.mockSession.loginTime).toISOString() : undefined
      };
    }
    
    // モックの場合は実際のファイルシステムを見ない
    if (options.mockStoredCredentials !== undefined) {
      details.hasStoredCredentials = options.mockStoredCredentials;
    } else if (options.verbose) {
      // verboseモードでモックが指定されていない場合はfalseにする
      details.hasStoredCredentials = false;
    }

    return {
      isLoggedIn,
      message: isLoggedIn && username ? `ログイン中 (${username})` : "ログアウト状態",
      details
    };
  }

  private maskToken(token: string): string {
    if (token.length <= 6) return token;
    return token.substring(0, 6) + "***";
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