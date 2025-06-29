export class RTMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RTMError";
  }
}

export class AuthError extends RTMError {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ConfigError extends RTMError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class NetworkError extends RTMError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}