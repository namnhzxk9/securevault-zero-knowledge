export async function decryptText(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const encryptedBytes = base64ToUint8Array(ciphertext);
  const ivBytes = base64ToUint8Array(iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes as BufferSource,
    },
    key,
    encryptedBytes as BufferSource
  );

  return new TextDecoder().decode(decrypted);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}