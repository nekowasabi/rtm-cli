import { assertEquals, assertExists } from "@std/assert";
import { Logger, LogLevel } from "../../src/utils/logger.ts";

Deno.test("Logger - インスタンス作成", () => {
  const logger = new Logger();
  assertExists(logger);
});

Deno.test("Logger - ログレベル設定", () => {
  const logger = new Logger();
  
  logger.setLevel(LogLevel.DEBUG);
  assertEquals(logger.getLevel(), LogLevel.DEBUG);
  
  logger.setLevel(LogLevel.INFO);
  assertEquals(logger.getLevel(), LogLevel.INFO);
  
  logger.setLevel(LogLevel.ERROR);
  assertEquals(logger.getLevel(), LogLevel.ERROR);
});

Deno.test("Logger - ログ出力テスト", () => {
  const logger = new Logger();
  logger.setLevel(LogLevel.DEBUG);
  
  // 実際の出力は確認しないが、エラーが発生しないことを確認
  logger.debug("デバッグメッセージ");
  logger.info("情報メッセージ");
  logger.warn("警告メッセージ");
  logger.error("エラーメッセージ");
});

Deno.test("Logger - ログレベルフィルタリング", () => {
  const logger = new Logger();
  
  // INFO レベル以上のみログ出力
  logger.setLevel(LogLevel.INFO);
  
  // これらのメソッドが正常に呼び出されることを確認
  logger.debug("表示されないはず");
  logger.info("表示される");
  logger.warn("表示される");
  logger.error("表示される");
});