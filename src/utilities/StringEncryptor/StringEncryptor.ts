import { createDecipheriv, createHash, createCipheriv, randomBytes } from "crypto";

export default class StringEncryptor {

  static decryptString(encryptedString: string, key: string): string {
    
    const keyHash = createHash("sha256").update(key).digest("base64");
    const buffer = Buffer.from(encryptedString, "base64");
    const iv = buffer.subarray(0, 16);
    const encryptedBuffer = buffer.subarray(16).toString("hex");
    const decipher = createDecipheriv("aes-256-cbc", keyHash, iv);
    let decryptedString = decipher.update(encryptedBuffer, "hex", "utf8");
    decryptedString += decipher.final("utf8");

    return decryptedString;

  }
  
  static encryptString(decryptedString: string, key: string): string {

    const keyHash = createHash("sha256").update(key).digest("base64");
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", keyHash, iv);
    let encryptedString = cipher.update(decryptedString, "utf8", "hex");
    encryptedString += cipher.final("hex");
    encryptedString = Buffer.from(encryptedString, "hex").toString("base64");
    encryptedString = iv.toString("base64") + encryptedString;

    return encryptedString;

  }

}