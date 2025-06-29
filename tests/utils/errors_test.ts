import { assertEquals, assertInstanceOf } from "@std/assert";
import { RTMError, AuthError, ConfigError, NetworkError } from "../../src/utils/errors.ts";

Deno.test("RTMError - 基本エラークラス", () => {
  const error = new RTMError("テストエラー");
  
  assertEquals(error.message, "テストエラー");
  assertEquals(error.name, "RTMError");
  assertInstanceOf(error, Error);
});

Deno.test("AuthError - 認証エラー", () => {
  const error = new AuthError("認証に失敗しました");
  
  assertEquals(error.message, "認証に失敗しました");
  assertEquals(error.name, "AuthError");
  assertInstanceOf(error, RTMError);
});

Deno.test("ConfigError - 設定エラー", () => {
  const error = new ConfigError("設定ファイルが見つかりません");
  
  assertEquals(error.message, "設定ファイルが見つかりません");
  assertEquals(error.name, "ConfigError");
  assertInstanceOf(error, RTMError);
});

Deno.test("NetworkError - ネットワークエラー", () => {
  const error = new NetworkError("接続に失敗しました");
  
  assertEquals(error.message, "接続に失敗しました");
  assertEquals(error.name, "NetworkError");
  assertInstanceOf(error, RTMError);
});