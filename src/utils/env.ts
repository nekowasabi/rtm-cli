export interface EnvCredentials {
  username?: string;
  password?: string;
}

export class EnvManager {
  private usernameKey: string;
  private passwordKey: string;

  constructor(usernameKey = "RTM_USERNAME", passwordKey = "RTM_PASSWORD") {
    this.usernameKey = usernameKey;
    this.passwordKey = passwordKey;
  }

  getCredentialsFromEnv(): EnvCredentials {
    const username = Deno.env.get(this.usernameKey);
    const password = Deno.env.get(this.passwordKey);

    return {
      username,
      password
    };
  }

  hasCompleteCredentials(): boolean {
    const credentials = this.getCredentialsFromEnv();
    return !!(credentials.username && credentials.password);
  }

  getUsernameKey(): string {
    return this.usernameKey;
  }

  getPasswordKey(): string {
    return this.passwordKey;
  }
}