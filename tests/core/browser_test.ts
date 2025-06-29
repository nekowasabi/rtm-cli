import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { BrowserManager, BrowserOptions } from "../../src/core/browser.ts";
import { NetworkError } from "../../src/utils/errors.ts";

Deno.test("BrowserManager - インスタンス作成", () => {
  const browserManager = new BrowserManager();
  assertExists(browserManager);
});

Deno.test("BrowserManager - ブラウザの起動と終了", async () => {
  const browserManager = new BrowserManager();
  const options: BrowserOptions = {
    headless: true,
    timeout: 30000
  };
  
  await browserManager.launch(options);
  assertEquals(browserManager.isLaunched(), true);
  
  await browserManager.close();
  assertEquals(browserManager.isLaunched(), false);
});

Deno.test("BrowserManager - ページ作成", async () => {
  const browserManager = new BrowserManager();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  assertExists(page);
  
  await browserManager.close();
});

Deno.test("BrowserManager - Remember the Milkログインページの操作", async () => {
  const browserManager = new BrowserManager();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  // ログインページに移動
  const success = await browserManager.navigateToLogin(page);
  assertEquals(success, true);
  
  await browserManager.close();
});

Deno.test("BrowserManager - ログイン試行", async () => {
  const browserManager = new BrowserManager();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  await browserManager.navigateToLogin(page);
  
  // モックのログイン情報でテスト
  const result = await browserManager.attemptLogin(page, "test@example.com", "password123");
  assertEquals(result.success, true);
  
  await browserManager.close();
});

Deno.test("BrowserManager - 無効な認証情報でのログイン失敗", async () => {
  const browserManager = new BrowserManager();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  await browserManager.navigateToLogin(page);
  
  const result = await browserManager.attemptLogin(page, "invalid@example.com", "wrongpassword");
  assertEquals(result.success, false);
  assertExists(result.error);
  
  await browserManager.close();
});

Deno.test("BrowserManager - セッション情報の取得", async () => {
  const browserManager = new BrowserManager();
  
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

Deno.test("BrowserManager - ネットワークエラーの処理", async () => {
  const browserManager = new BrowserManager();
  
  await browserManager.launch({ headless: true });
  const page = await browserManager.newPage();
  
  // 存在しないURLに移動を試行
  await assertRejects(
    () => browserManager.navigateToUrl(page, "https://nonexistent-domain-12345.com"),
    NetworkError,
    "ページの読み込みに失敗"
  );
  
  await browserManager.close();
});

Deno.test("BrowserManager - タイムアウト設定", async () => {
  const browserManager = new BrowserManager();
  
  await browserManager.launch({ 
    headless: true, 
    timeout: 1000  // 1秒の短いタイムアウト
  });
  
  const page = await browserManager.newPage();
  
  // タイムアウトが設定されていることを確認
  assertEquals(browserManager.getTimeout(), 1000);
  
  await browserManager.close();
});