import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
import { encrypt, decrypt, generateKey } from "../../src/utils/crypto.ts";

Deno.test("Crypto - キー生成", async () => {
  const key1 = await generateKey();
  const key2 = await generateKey();
  
  assertNotEquals(key1, key2);
  assertEquals(key1.length, 64); // 32バイトのHEX文字列
});

Deno.test("Crypto - 暗号化と復号化", async () => {
  const key = await generateKey();
  const plaintext = "テストデータ";
  
  const encrypted = await encrypt(plaintext, key);
  assertNotEquals(encrypted, plaintext);
  
  const decrypted = await decrypt(encrypted, key);
  assertEquals(decrypted, plaintext);
});

Deno.test("Crypto - 異なるキーでの復号化は失敗", async () => {
  const key1 = await generateKey();
  const key2 = await generateKey();
  const plaintext = "テストデータ";
  
  const encrypted = await encrypt(plaintext, key1);
  
  await assertRejects(
    () => decrypt(encrypted, key2),
    Error,
    "復号化に失敗"
  );
});

Deno.test("Crypto - 空文字列の暗号化", async () => {
  const key = await generateKey();
  const plaintext = "";
  
  const encrypted = await encrypt(plaintext, key);
  const decrypted = await decrypt(encrypted, key);
  
  assertEquals(decrypted, plaintext);
});

Deno.test("Crypto - 日本語文字列の暗号化", async () => {
  const key = await generateKey();
  const plaintext = "こんにちは、世界！🌍";
  
  const encrypted = await encrypt(plaintext, key);
  const decrypted = await decrypt(encrypted, key);
  
  assertEquals(decrypted, plaintext);
});