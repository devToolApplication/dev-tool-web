import { describe, expect, it } from 'vitest';
import quantTranslations from '../../core/i18n/features/quant-backtest.i18n.json';

describe('quant-backtest i18n dictionary', () => {
  it('contains both vi and en translation maps', () => {
    expect(quantTranslations.vi).toBeDefined();
    expect(quantTranslations.en).toBeDefined();
  });

  it('has identical keys in both vi and en maps without missing translations', () => {
    const viKeys = Object.keys(quantTranslations.vi).sort();
    const enKeys = Object.keys(quantTranslations.en).sort();

    expect(viKeys).toEqual(enKeys);
    expect(viKeys.length).toBeGreaterThan(40);

    for (const key of viKeys) {
      const viVal = (quantTranslations.vi as Record<string, string>)[key];
      const enVal = (quantTranslations.en as Record<string, string>)[key];

      expect(viVal?.trim().length).toBeGreaterThan(0);
      expect(enVal?.trim().length).toBeGreaterThan(0);
    }
  });

  it('covers core navigation, metric, wizard, and table translation keys', () => {
    const vi = quantTranslations.vi as Record<string, string>;

    expect(vi['quantBacktest.nav.title']).toBeDefined();
    expect(vi['quantBacktest.runs.title']).toBeDefined();
    expect(vi['quantBacktest.create.title']).toBeDefined();
    expect(vi['quantBacktest.detail.title']).toBeDefined();
    expect(vi['quantBacktest.strategies.title']).toBeDefined();
    expect(vi['quantBacktest.status.SUCCESS']).toBeDefined();
    expect(vi['quantBacktest.status.FAILED']).toBeDefined();
    expect(vi['quantBacktest.status.COMPLETED']).toBeDefined();
  });

  it('explicitly localizes all required trading, order, signal and simulation enum keys', () => {
    const vi = quantTranslations.vi as Record<string, string>;
    const en = quantTranslations.en as Record<string, string>;

    const requiredKeys = [
      'quantBacktest.side.LONG',
      'quantBacktest.side.SHORT',
      'quantBacktest.side.BUY',
      'quantBacktest.side.SELL',
      'quantBacktest.tradeSide.LONG',
      'quantBacktest.tradeSide.SHORT',
      'quantBacktest.orderSide.BUY',
      'quantBacktest.orderSide.SELL',
      'quantBacktest.orderStatus.CREATED',
      'quantBacktest.orderStatus.SUBMITTED',
      'quantBacktest.orderStatus.FILLED',
      'quantBacktest.orderStatus.CANCELED',
      'quantBacktest.orderStatus.CANCELLED',
      'quantBacktest.orderStatus.REJECTED',
      'quantBacktest.orderStatus.EXPIRED',
      'quantBacktest.orderStatus.PENDING',
      'quantBacktest.signalAction.BUY',
      'quantBacktest.signalAction.SELL',
      'quantBacktest.signalAction.CLOSE',
      'quantBacktest.signalAction.HOLD',
      'quantBacktest.executionMode.RUN_NOW',
      'quantBacktest.executionMode.SCHEDULE',
      'quantBacktest.simulation.CONSERVATIVE_STOP_FIRST',
      'quantBacktest.simulation.BINANCE_USDM_V1',
      'quantBacktest.simulation.BINANCE_SPOT_VIP0',
      'quantBacktest.simulation.FIXED_BPS',
      'quantBacktest.simulation.ZERO',
    ];

    for (const key of requiredKeys) {
      expect(vi[key], `Missing vi translation for ${key}`).toBeDefined();
      expect(en[key], `Missing en translation for ${key}`).toBeDefined();
      expect(vi[key].length).toBeGreaterThan(0);
      expect(en[key].length).toBeGreaterThan(0);
    }
  });

  it('contains no mojibake, replacement characters, or corrupted strings in vi or en', () => {
    const vi = quantTranslations.vi as Record<string, string>;
    const en = quantTranslations.en as Record<string, string>;

    for (const [key, value] of Object.entries(vi)) {
      expect(value).not.toContain('�');
      if (value.includes('?') && !key.toLowerCase().includes('question') && !value.endsWith('?')) {
        expect.fail(`Suspicious question mark in vi.${key}: ${value}`);
      }
    }

    for (const [key, value] of Object.entries(en)) {
      expect(value).not.toContain('�');
      if (value.includes('?') && !key.toLowerCase().includes('question') && !value.endsWith('?')) {
        expect.fail(`Suspicious question mark in en.${key}: ${value}`);
      }
    }
  });
});
