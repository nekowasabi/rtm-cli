export async function generateKey(): Promise<string> {
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  return Array.from(key, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function encrypt(plaintext: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // キーをUint8Arrayに変換
  const keyBytes = new Uint8Array(key.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  // AES-GCMキーをインポート
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  // IVを生成
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  
  // 暗号化
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    data
  );
  
  // IVと暗号化データを結合してBase64エンコード
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(ciphertext: string, key: string): Promise<string> {
  try {
    // Base64デコード
    const combined = new Uint8Array(
      atob(ciphertext).split('').map(char => char.charCodeAt(0))
    );
    
    // IVと暗号化データを分離
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // キーをUint8Arrayに変換
    const keyBytes = new Uint8Array(key.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    // AES-GCMキーをインポート
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    
    // 復号化
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encrypted
    );
    
    // テキストに変換
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    throw new Error("復号化に失敗しました");
  }
}