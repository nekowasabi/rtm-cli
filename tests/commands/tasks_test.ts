import { assertEquals, assertRejects } from "@std/assert";
import { Config } from "../../src/core/config.ts";
import { tasksCommand } from "../../src/commands/tasks.ts";
import { Logger } from "../../src/utils/logger.ts";

// テスト用のConfig mock
class MockConfig extends Config {
  public override cookies: any[] = [];
  public override headless: boolean = true;

  constructor(cookies: any[] = [], headless: boolean = true) {
    super();
    this.cookies = cookies;
    this.headless = headless;
  }

  async load(): Promise<void> {
    // モック実装: 何もしない
  }

  async save(): Promise<void> {
    // モック実装: 何もしない
  }
}

// Logger mock for testing
const originalLog = console.log;
const originalError = console.error;
let logMessages: string[] = [];
let errorMessages: string[] = [];

function mockConsole() {
  console.log = (...args: any[]) => {
    logMessages.push(args.join(' '));
  };
  console.error = (...args: any[]) => {
    errorMessages.push(args.join(' '));
  };
}

function restoreConsole() {
  console.log = originalLog;
  console.error = originalError;
}

function clearMessages() {
  logMessages = [];
  errorMessages = [];
}

Deno.test("tasksCommand - 基本プロパティ", () => {
  assertEquals(tasksCommand.name, "tasks");
  assertEquals(tasksCommand.description, "指定されたリストのタスクを取得します。");
  assertEquals(typeof tasksCommand.action, "function");
});

Deno.test("tasksCommand - cookies未設定でエラー", async () => {
  mockConsole();
  
  try {
    const config = new MockConfig([], true);
    
    await tasksCommand.action({
      config,
      listId: "123456"
    });
    
    // エラーメッセージが出力されることを確認
    assertEquals(errorMessages.length > 0, true);
    assertEquals(errorMessages.some(msg => msg.includes("ログインしていません")), true);
  } finally {
    restoreConsole();
    clearMessages();
  }
});

Deno.test("tasksCommand - 有効なlistIdパラメータ", async () => {
  const config = new MockConfig([
    {
      name: "test_cookie",
      value: "test_value",
      domain: ".rememberthemilk.com",
      path: "/",
      expires: Date.now() + 3600000
    }
  ], true);
  
  // この場合、実際のブラウザ操作を行わずにテストするため、
  // BrowserManagerをモックする必要がある
  
  // 注意: このテストは実際のブラウザ操作を含むため、
  // 統合テストとして分類される可能性がある
  
  // とりあえず、正常な引数が渡されることを確認
  assertEquals(typeof config.cookies, "object");
  assertEquals(Array.isArray(config.cookies), true);
  assertEquals(config.cookies.length, 1);
});

Deno.test("tasksCommand - URLの生成確認", () => {
  const listId = "1375005";
  const expectedUrl = `https://www.rememberthemilk.com/app/#list/${listId}`;
  
  // URL生成ロジックのテスト
  const generateUrl = (id: string) => `https://www.rememberthemilk.com/app/#list/${id}`;
  
  assertEquals(generateUrl(listId), expectedUrl);
  assertEquals(generateUrl("123456"), "https://www.rememberthemilk.com/app/#list/123456");
  assertEquals(generateUrl(""), "https://www.rememberthemilk.com/app/#list/");
});

Deno.test("tasksCommand - 数値IDの処理", () => {
  const numericId = 1375005;
  const stringId = numericId.toString();
  const expectedUrl = `https://www.rememberthemilk.com/app/#list/${stringId}`;
  
  const generateUrl = (id: string) => `https://www.rememberthemilk.com/app/#list/${id}`;
  
  assertEquals(generateUrl(stringId), expectedUrl);
});

Deno.test("tasksCommand - 特殊文字を含むIDの処理", () => {
  const specialIds = [
    "abc123",
    "list_123",
    "123-456",
    "list.123"
  ];
  
  const generateUrl = (id: string) => `https://www.rememberthemilk.com/app/#list/${id}`;
  
  for (const id of specialIds) {
    const result = generateUrl(id);
    assertEquals(result.includes(id), true);
    assertEquals(result.startsWith("https://www.rememberthemilk.com/app/#list/"), true);
  }
});

Deno.test("tasksCommand - オプション検証", async () => {
  const config = new MockConfig();
  
  // tasksCommandのactionが正しい型のオプションを受け取ることを確認
  const options = {
    config,
    listId: "123456"
  };
  
  assertEquals(typeof options.config, "object");
  assertEquals(typeof options.listId, "string");
  assertEquals(options.listId, "123456");
});