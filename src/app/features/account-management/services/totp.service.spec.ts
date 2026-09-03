import { TestBed } from '@angular/core/testing';
import { TotpService } from './totp.service';

describe('TotpService', () => {
  let service: TotpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TotpService],
    });
    service = TestBed.inject(TotpService);
  });

  it('validates correct Base32 strings', () => {
    expect(service.isValidBase32('JBSWY3DPEHPK3PXP')).toBe(true);
    expect(service.isValidBase32('234567')).toBe(true);
    expect(service.isValidBase32('INVALID_189!')).toBe(false);
    expect(service.isValidBase32('')).toBe(false);
  });

  it('calculates remaining seconds between 1 and 30', () => {
    const seconds = service.getRemainingSeconds();
    expect(seconds).toBeGreaterThanOrEqual(1);
    expect(seconds).toBeLessThanOrEqual(30);
  });

  it('generates 6-digit OTP from valid secret key', async () => {
    const otp = await service.generateOtp('JBSWY3DPEHPK3PXP');
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('returns INVALID for non-base32 secret', async () => {
    const otp = await service.generateOtp('189_INVALID!');
    expect(otp).toBe('INVALID');
  });

  it('returns empty string for empty input', async () => {
    const otp = await service.generateOtp('');
    expect(otp).toBe('');
  });
});