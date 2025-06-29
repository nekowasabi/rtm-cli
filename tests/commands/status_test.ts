import { assertEquals, assertExists } from "@std/assert";
import { StatusCommand } from "../../src/commands/status.ts";

Deno.test("StatusCommand - インスタンス作成", () => {
  const statusCommand = new StatusCommand();
  assertExists(statusCommand);
});

Deno.test("StatusCommand - ログイン状態の確認", async () => {
  const statusCommand = new StatusCommand();
  
  const result = await statusCommand.execute({
    verbose: false
  });
  
  assertExists(result.isLoggedIn);
  assertExists(result.message);
  assertEquals(typeof result.isLoggedIn, "boolean");
});

Deno.test("StatusCommand - 詳細表示モード", async () => {
  const statusCommand = new StatusCommand();
  
  const result = await statusCommand.execute({
    verbose: true
  });
  
  assertExists(result.isLoggedIn);
  assertExists(result.message);
  assertExists(result.details);
  assertEquals(typeof result.details, "object");
});

Deno.test("StatusCommand - ログイン中の状態表示", async () => {
  const statusCommand = new StatusCommand();
  
  // ログイン状態をシミュレート
  const result = await statusCommand.execute({
    verbose: true,
    mockLoggedIn: true,
    mockUser: "test@example.com"
  });
  
  assertEquals(result.isLoggedIn, true);
  assertEquals(result.message, "ログイン中 (test@example.com)");
  assertEquals(result.details?.username, "test@example.com");
});

Deno.test("StatusCommand - ログアウト状態の表示", async () => {
  const statusCommand = new StatusCommand();
  
  // ログアウト状態をシミュレート
  const result = await statusCommand.execute({
    verbose: false,
    mockLoggedIn: false
  });
  
  assertEquals(result.isLoggedIn, false);
  assertEquals(result.message, "ログアウト状態");
});

Deno.test("StatusCommand - セッション情報の詳細表示", async () => {
  const statusCommand = new StatusCommand();
  
  const result = await statusCommand.execute({
    verbose: true,
    mockLoggedIn: true,
    mockUser: "test@example.com",
    mockSession: {
      token: "abc123def456",
      expires: Date.now() + 3600000,
      loginTime: Date.now() - 1800000
    }
  });
  
  assertEquals(result.isLoggedIn, true);
  assertExists(result.details?.session);
  assertEquals(result.details?.session?.token, "abc123***");
  assertExists(result.details?.session?.expiresAt);
  assertExists(result.details?.session?.loginTime);
});

Deno.test("StatusCommand - 認証情報保存状態の確認", async () => {
  const statusCommand = new StatusCommand();
  
  const result = await statusCommand.execute({
    verbose: true,
    mockLoggedIn: false,
    mockStoredCredentials: true
  });
  
  assertExists(result.details?.hasStoredCredentials);
  assertEquals(result.details?.hasStoredCredentials, true);
});