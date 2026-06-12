export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    encoder.encode(plaintext) as BufferSource
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: uint8ArrayToBase64(iv),
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return uint8ArrayToBase64(bytes);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}