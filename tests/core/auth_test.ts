import { assertEquals, assertExists, assertRejects, assertFalse } from "@std/assert";
import { AuthManager, Credentials } from "../../src/core/auth.ts";
import { AuthError } from "../../src/utils/errors.ts";

Deno.test("Credentials - インスタンス作成", async () => {
  const creds = await Credentials.create("test@example.com", "password123");
  
  assertEquals(creds.username, "test@example.com");
  assertExists(creds.createdAt);
});

Deno.test("Credentials - パスワードの検証", async () => {
  const creds = await Credentials.create("test@example.com", "password123");
  
  assertEquals(await creds.validatePassword("password123"), true);
  assertEquals(await creds.validatePassword("wrongpassword"), false);
});

Deno.test("AuthManager - インスタンス作成", () => {
  const authManager = new AuthManager();
  assertExists(authManager);
});

Deno.test("AuthManager - 認証情報の保存と読み込み", async () => {
  const authManager = new AuthManager();
  const creds = await Credentials.create("test@example.com", "password123");
  
  // 一時ディレクトリに保存
  const tempDir = await Deno.makeTempDir();
  const authPath = `${tempDir}/auth.json`;
  
  await authManager.saveCredentials(creds, authPath);
  const loadedCreds = await authManager.loadCredentials(authPath);
  
  assertEquals(loadedCreds.username, "test@example.com");
  assertEquals(await loadedCreds.validatePassword("password123"), true);
  
  // クリーンアップ
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("AuthManager - 認証情報のクリア", async () => {
  const authManager = new AuthManager();
  const creds = await Credentials.create("test@example.com", "password123");
  
  // 一時ディレクトリに保存
  const tempDir = await Deno.makeTempDir();
  const authPath = `${tempDir}/auth.json`;
  
  await authManager.saveCredentials(creds, authPath);
  await authManager.clearCredentials(authPath);
  
  // ファイルが存在しないことを確認
  assertFalse(await authManager.hasStoredCredentials(authPath));
  
  // クリーンアップ
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("AuthManager - 存在しない認証情報の確認", async () => {
  const authManager = new AuthManager();
  
  assertFalse(await authManager.hasStoredCredentials("/nonexistent/auth.json"));
});

Deno.test("AuthManager - 存在しない認証情報の読み込み", async () => {
  const authManager = new AuthManager();
  
  await assertRejects(
    () => authManager.loadCredentials("/nonexistent/auth.json"),
    AuthError,
    "認証情報が見つかりません"
  );
});

Deno.test("AuthManager - セッション情報の管理", () => {
  const authManager = new AuthManager();
  
  assertEquals(authManager.isLoggedIn(), false);
  
  const sessionData = { token: "abc123", expires: Date.now() + 3600000 };
  authManager.setSession(sessionData);
  
  assertEquals(authManager.isLoggedIn(), true);
  assertEquals(authManager.getSession()?.token, "abc123");
  
  authManager.clearSession();
  assertEquals(authManager.isLoggedIn(), false);
});

Deno.test("AuthManager - セッション有効期限の確認", () => {
  const authManager = new AuthManager();
  
  // 過去の時刻でセッションを設定
  const expiredSession = { token: "abc123", expires: Date.now() - 1000 };
  authManager.setSession(expiredSession);
  
  assertEquals(authManager.isLoggedIn(), false);
  
  // 未来の時刻でセッションを設定
  const validSession = { token: "abc123", expires: Date.now() + 3600000 };
  authManager.setSession(validSession);
  
  assertEquals(authManager.isLoggedIn(), true);
});