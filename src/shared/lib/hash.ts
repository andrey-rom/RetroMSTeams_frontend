/**
 * SHA256(userId:sessionId) — matches server `generateOwnerHash` for card ownership.
 */
export async function generateOwnerHash(userId: string, sessionId: string): Promise<string> {
  const data = `${userId}:${sessionId}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
