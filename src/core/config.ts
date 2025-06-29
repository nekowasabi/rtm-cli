import { ConfigError } from "../utils/errors.ts";
import { Cookie } from "playwright";

export class Config {
  timeout: number = 30000;
  headless: boolean = true;
  saveCredentials: boolean = false;
  logLevel: string = "info";
  configPath?: string;
  authPath?: string;
  cookies?: Cookie[];

  constructor(partial?: Partial<Config>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class ConfigManager {
  async save(config: Config, path: string): Promise<void> {
    try {
      const configData = JSON.stringify(config, null, 2);
      await Deno.writeTextFile(path, configData);
    } catch (error) {
      throw new ConfigError(`設定ファイルの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async load(path: string): Promise<Config> {
    try {
      const stat = await Deno.stat(path);
      if (!stat.isFile) {
        throw new ConfigError("設定ファイルが見つかりません");
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new ConfigError("設定ファイルが見つかりません");
      }
      throw error;
    }

    try {
      const configData = await Deno.readTextFile(path);
      const parsed = JSON.parse(configData);
      return new Config(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ConfigError("設定ファイルの解析に失敗しました");
      }
      throw new ConfigError(`設定ファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getDefault(): Config {
    return new Config();
  }

  async exists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isFile;
    } catch {
      return false;
    }
  }
}
