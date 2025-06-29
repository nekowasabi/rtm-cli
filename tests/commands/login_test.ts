import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { LoginCommand } from "../../src/commands/login.ts";
import { AuthError } from "../../src/utils/errors.ts";

Deno.test("LoginCommand - インスタンス作成", () => {
  const loginCommand = new LoginCommand();
  assertExists(loginCommand);
});

Deno.test("LoginCommand - ユーザー名とパスワードでのログイン", async () => {
  const loginCommand = new LoginCommand();
  
  const result = await loginCommand.execute({
    username: "test@example.com",
    password: "password123",
    save: false,
    headless: true
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "ログインに成功しました");
});

Deno.test("LoginCommand - 認証情報保存オプション", async () => {
  const loginCommand = new LoginCommand();
  
  const result = await loginCommand.execute({
    username: "test@example.com",
    password: "password123",
    save: true,
    headless: true
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "ログインに成功しました（認証情報を保存しました）");
});

Deno.test("LoginCommand - 無効な認証情報でのログイン", async () => {
  const loginCommand = new LoginCommand();
  
  await assertRejects(
    () => loginCommand.execute({
      username: "invalid@example.com",
      password: "wrongpassword",
      save: false,
      headless: true
    }),
    AuthError,
    "ログインに失敗しました"
  );
});

Deno.test("LoginCommand - 保存された認証情報でのログイン", async () => {
  const loginCommand = new LoginCommand();
  
  const result = await loginCommand.executeWithStoredCredentials({
    headless: true
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "保存された認証情報でログインしました");
});

Deno.test("LoginCommand - 保存された認証情報が無い場合", async () => {
  const loginCommand = new LoginCommand("/nonexistent/auth.json");
  
  await assertRejects(
    () => loginCommand.executeWithStoredCredentials({
      headless: true
    }),
    AuthError,
    "保存された認証情報が見つかりません"
  );
});

Deno.test("LoginCommand - インタラクティブログイン", async () => {
  const loginCommand = new LoginCommand();
  
  // モックの入力を設定
  const mockInput = {
    username: "interactive@example.com",
    password: "interactivepass"
  };
  
  const result = await loginCommand.executeInteractive(mockInput, {
    headless: true
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "ログインに成功しました");
});

Deno.test("LoginCommand - ブラウザオプション", async () => {
  const loginCommand = new LoginCommand();
  
  // ヘッドレスモード無効
  const result = await loginCommand.execute({
    username: "test@example.com",
    password: "password123",
    save: false,
    headless: false
  });
  
  assertEquals(result.success, true);
});

Deno.test("LoginCommand - 環境変数からの認証情報使用", async () => {
  // 環境変数を設定
  Deno.env.set("RTM_USERNAME", "env@example.com");
  Deno.env.set("RTM_PASSWORD", "envpassword123");
  
  const loginCommand = new LoginCommand();
  
  const result = await loginCommand.executeWithEnvCredentials({
    headless: true
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "環境変数の認証情報でログインしました");
  
  // クリーンアップ
  Deno.env.delete("RTM_USERNAME");
  Deno.env.delete("RTM_PASSWORD");
});

Deno.test("LoginCommand - 環境変数が不完全な場合", async () => {
  // ユーザー名のみ設定
  Deno.env.set("RTM_USERNAME", "env@example.com");
  Deno.env.delete("RTM_PASSWORD");
  
  const loginCommand = new LoginCommand();
  
  await assertRejects(
    () => loginCommand.executeWithEnvCredentials({
      headless: true
    }),
    AuthError,
    "環境変数に完全な認証情報が設定されていません"
  );
  
  // クリーンアップ
  Deno.env.delete("RTM_USERNAME");
});

Deno.test("LoginCommand - 環境変数が設定されていない場合", async () => {
  // 環境変数をクリア
  Deno.env.delete("RTM_USERNAME");
  Deno.env.delete("RTM_PASSWORD");
  
  const loginCommand = new LoginCommand();
  
  await assertRejects(
    () => loginCommand.executeWithEnvCredentials({
      headless: true
    }),
    AuthError,
    "環境変数に完全な認証情報が設定されていません"
  );
});