import fs from "fs/promises";
import crypto from "crypto";

export async function hashFile(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

