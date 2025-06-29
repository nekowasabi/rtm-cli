export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`);
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${new Date().toISOString()} ${message}`);
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} ${message}`);
    }
  }

  error(message: string): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} ${message}`);
    }
  }
}