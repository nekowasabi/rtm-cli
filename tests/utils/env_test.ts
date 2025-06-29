import { assertEquals, assertExists } from "@std/assert";
import { EnvManager } from "../../src/utils/env.ts";

Deno.test("EnvManager - インスタンス作成", () => {
  const envManager = new EnvManager();
  assertExists(envManager);
});

Deno.test("EnvManager - 環境変数からの認証情報取得（設定あり）", () => {
  // テスト用の環境変数を設定
  Deno.env.set("RTM_USERNAME", "test@example.com");
  Deno.env.set("RTM_PASSWORD", "testpassword123");
  
  const envManager = new EnvManager();
  const credentials = envManager.getCredentialsFromEnv();
  
  assertEquals(credentials.username, "test@example.com");
  assertEquals(credentials.password, "testpassword123");
  
  // テスト後にクリーンアップ
  Deno.env.delete("RTM_USERNAME");
  Deno.env.delete("RTM_PASSWORD");
});

Deno.test("EnvManager - 環境変数からの認証情報取得（設定なし）", () => {
  // 環境変数が設定されていないことを確認
  Deno.env.delete("RTM_USERNAME");
  Deno.env.delete("RTM_PASSWORD");
  
  const envManager = new EnvManager();
  const credentials = envManager.getCredentialsFromEnv();
  
  assertEquals(credentials.username, undefined);
  assertEquals(credentials.password, undefined);
});

Deno.test("EnvManager - ユーザー名のみ設定", () => {
  Deno.env.set("RTM_USERNAME", "test@example.com");
  Deno.env.delete("RTM_PASSWORD");
  
  const envManager = new EnvManager();
  const credentials = envManager.getCredentialsFromEnv();
  
  assertEquals(credentials.username, "test@example.com");
  assertEquals(credentials.password, undefined);
  
  // クリーンアップ
  Deno.env.delete("RTM_USERNAME");
});

Deno.test("EnvManager - パスワードのみ設定", () => {
  Deno.env.delete("RTM_USERNAME");
  Deno.env.set("RTM_PASSWORD", "testpassword123");
  
  const envManager = new EnvManager();
  const credentials = envManager.getCredentialsFromEnv();
  
  assertEquals(credentials.username, undefined);
  assertEquals(credentials.password, "testpassword123");
  
  // クリーンアップ
  Deno.env.delete("RTM_PASSWORD");
});

Deno.test("EnvManager - 認証情報の完全性チェック", () => {
  const envManager = new EnvManager();
  
  // 両方設定されている場合
  Deno.env.set("RTM_USERNAME", "test@example.com");
  Deno.env.set("RTM_PASSWORD", "testpassword123");
  
  assertEquals(envManager.hasCompleteCredentials(), true);
  
  // ユーザー名のみ
  Deno.env.delete("RTM_PASSWORD");
  assertEquals(envManager.hasCompleteCredentials(), false);
  
  // パスワードのみ
  Deno.env.delete("RTM_USERNAME");
  Deno.env.set("RTM_PASSWORD", "testpassword123");
  assertEquals(envManager.hasCompleteCredentials(), false);
  
  // 両方なし
  Deno.env.delete("RTM_PASSWORD");
  assertEquals(envManager.hasCompleteCredentials(), false);
  
  // クリーンアップ
  Deno.env.delete("RTM_USERNAME");
  Deno.env.delete("RTM_PASSWORD");
});

Deno.test("EnvManager - カスタム環境変数名", () => {
  const envManager = new EnvManager("CUSTOM_USER", "CUSTOM_PASS");
  
  Deno.env.set("CUSTOM_USER", "custom@example.com");
  Deno.env.set("CUSTOM_PASS", "custompass");
  
  const credentials = envManager.getCredentialsFromEnv();
  
  assertEquals(credentials.username, "custom@example.com");
  assertEquals(credentials.password, "custompass");
  assertEquals(envManager.hasCompleteCredentials(), true);
  
  // クリーンアップ
  Deno.env.delete("CUSTOM_USER");
  Deno.env.delete("CUSTOM_PASS");
});