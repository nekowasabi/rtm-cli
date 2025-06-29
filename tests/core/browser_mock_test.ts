import { assertEquals, assertExists } from "@std/assert";
import { BrowserManagerMock } from "../../src/core/browser_mock.ts";

Deno.test("BrowserManagerMock - インスタンス作成", () => {
  const browserManager = new BrowserManagerMock();
  assertExists(browserManager);
});

Deno.test("BrowserManagerMock - 起動と終了", async () => {
  const browserManager = new BrowserManagerMock();
  
  await browserManager.launch({ headless: true });
  assertEquals(browserManager.isLaunched(), true);
  
  await browserManager.close();
  assertEquals(browserManager.isLaunched(), false);
});

Deno.test("BrowserManagerMock - ページ作成", async () => {
  const browserManager = new BrowserManagerMock();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  assertExists(page);
  
  await browserManager.close();
});

Deno.test("BrowserManagerMock - ログイン成功", async () => {
  const browserManager = new BrowserManagerMock();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  await browserManager.navigateToLogin(page);
  
  const result = await browserManager.attemptLogin(page, "test@example.com", "password123");
  assertEquals(result.success, true);
  
  await browserManager.close();
});

Deno.test("BrowserManagerMock - ログイン失敗", async () => {
  const browserManager = new BrowserManagerMock();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  await browserManager.navigateToLogin(page);
  
  const result = await browserManager.attemptLogin(page, "invalid@example.com", "wrongpassword");
  assertEquals(result.success, false);
  assertExists(result.error);
  
  await browserManager.close();
});

Deno.test("BrowserManagerMock - セッション情報取得", async () => {
  const browserManager = new BrowserManagerMock();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  await browserManager.navigateToLogin(page);
  await browserManager.attemptLogin(page, "test@example.com", "password123");
  
  const session = await browserManager.extractSessionInfo(page);
  assertExists(session);
  assertExists(session.token);
  assertExists(session.expires);
  
  await browserManager.close();
});