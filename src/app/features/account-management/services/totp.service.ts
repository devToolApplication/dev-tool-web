import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TotpService {
  private base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  public getRemainingSeconds(): number {
    const epoch = Math.floor(Date.now() / 1000);
    return 30 - (epoch % 30);
  }

  public async generateOtp(secret: string): Promise<string> {
    if (!secret || typeof secret !== 'string') {
      return '';
    }

    const cleanSecret = secret.toUpperCase().replace(/[\s\-_]/g, '');
    if (!this.isValidBase32(cleanSecret)) {
      return 'INVALID';
    }

    try {
      const epoch = Math.floor(Date.now() / 1000);
      const counter = Math.floor(epoch / 30);
      return await this.hotp(cleanSecret, counter);
    } catch {
      return 'ERROR';
    }
  }

  public isValidBase32(str: string): boolean {
    if (!str) return false;
    for (let i = 0; i < str.length; i++) {
      if (this.base32Chars.indexOf(str[i]) === -1) {
        return false;
      }
    }
    return str.length > 0;
  }

  private base32ToBytes(base32: string): Uint8Array {
    const clean = base32.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (let i = 0; i < clean.length; i++) {
      const val = this.base32Chars.indexOf(clean.charAt(i));
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
    }
    return bytes;
  }

  private async hotp(secret: string, counter: number): Promise<string> {
    const key = this.base32ToBytes(secret);
    const counterBytes = new Uint8Array(8);
    let temp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      key.buffer as ArrayBuffer,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes.buffer as ArrayBuffer);
    const hash = new Uint8Array(signature);
    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }
}