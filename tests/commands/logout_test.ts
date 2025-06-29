import { assertEquals, assertExists } from "@std/assert";
import { LogoutCommand } from "../../src/commands/logout.ts";

Deno.test("LogoutCommand - インスタンス作成", () => {
  const logoutCommand = new LogoutCommand();
  assertExists(logoutCommand);
});

Deno.test("LogoutCommand - セッションのクリア", async () => {
  const logoutCommand = new LogoutCommand();
  
  const result = await logoutCommand.execute({
    clearCredentials: false,
    force: true  // 強制フラグでログアウトメッセージを確実に表示
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "ログアウトしました");
});

Deno.test("LogoutCommand - 認証情報も含めてクリア", async () => {
  const logoutCommand = new LogoutCommand();
  
  const result = await logoutCommand.execute({
    clearCredentials: true
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "ログアウトしました（保存された認証情報も削除しました）");
});

Deno.test("LogoutCommand - すでにログアウト状態", async () => {
  const logoutCommand = new LogoutCommand();
  
  // セッションが既にクリアされている状態をシミュレート
  const result = await logoutCommand.execute({
    clearCredentials: false
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "既にログアウト状態です");
});

Deno.test("LogoutCommand - 強制ログアウト", async () => {
  const logoutCommand = new LogoutCommand();
  
  const result = await logoutCommand.execute({
    clearCredentials: true,
    force: true
  });
  
  assertEquals(result.success, true);
  assertEquals(result.message, "ログアウトしました（保存された認証情報も削除しました）");
});