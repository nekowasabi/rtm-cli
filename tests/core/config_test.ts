import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { Config, ConfigManager } from "../../src/core/config.ts";
import { ConfigError } from "../../src/utils/errors.ts";

Deno.test("Config - デフォルト設定", () => {
  const config = new Config();
  
  assertEquals(config.timeout, 30000);
  assertEquals(config.headless, true);
  assertEquals(config.saveCredentials, false);
  assertEquals(config.logLevel, "info");
});

Deno.test("Config - 設定の更新", () => {
  const config = new Config();
  
  config.timeout = 60000;
  config.headless = false;
  config.saveCredentials = true;
  config.logLevel = "debug";
  
  assertEquals(config.timeout, 60000);
  assertEquals(config.headless, false);
  assertEquals(config.saveCredentials, true);
  assertEquals(config.logLevel, "debug");
});

Deno.test("ConfigManager - インスタンス作成", () => {
  const manager = new ConfigManager();
  assertExists(manager);
});

Deno.test("ConfigManager - 設定の保存と読み込み", async () => {
  const manager = new ConfigManager();
  const testConfig = new Config();
  testConfig.timeout = 45000;
  testConfig.headless = false;
  
  // 一時ファイルに保存
  const tempDir = await Deno.makeTempDir();
  const configPath = `${tempDir}/test-config.json`;
  
  await manager.save(testConfig, configPath);
  const loadedConfig = await manager.load(configPath);
  
  assertEquals(loadedConfig.timeout, 45000);
  assertEquals(loadedConfig.headless, false);
  
  // クリーンアップ
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("ConfigManager - 存在しないファイルの読み込み", async () => {
  const manager = new ConfigManager();
  
  await assertRejects(
    () => manager.load("/nonexistent/config.json"),
    ConfigError,
    "設定ファイルが見つかりません"
  );
});

Deno.test("ConfigManager - 不正なJSONファイルの読み込み", async () => {
  const manager = new ConfigManager();
  
  // 一時ファイルに不正なJSONを作成
  const tempDir = await Deno.makeTempDir();
  const configPath = `${tempDir}/invalid-config.json`;
  await Deno.writeTextFile(configPath, "{ invalid json }");
  
  await assertRejects(
    () => manager.load(configPath),
    ConfigError,
    "設定ファイルの解析に失敗"
  );
  
  // クリーンアップ
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("ConfigManager - デフォルト設定の取得", () => {
  const manager = new ConfigManager();
  const defaultConfig = manager.getDefault();
  
  assertEquals(defaultConfig.timeout, 30000);
  assertEquals(defaultConfig.headless, true);
  assertEquals(defaultConfig.saveCredentials, false);
  assertEquals(defaultConfig.logLevel, "info");
});