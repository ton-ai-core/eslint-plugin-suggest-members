import { describe, test, expect } from '@jest/globals';
import { compositeScore } from './helpers';

describe('compositeScore invariants', () => {
  test('bounded in [0,1]', () => {
    const cases: Array<[string,string]> = [
      ['readFil','readFile'],
      ['x','xxxxxxxxxxxxxxxx'],
      ['ABC','ABC'],
      ['TONConnectPage.css','TONConnectPage'],
    ];
    for (const [a,b] of cases) {
      const s = compositeScore(a,b);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  test('prefix monotonicity (approx)', () => {
    const a = 'readFil';
    const c1 = 'readFile';
    const c2 = 'readddddd';
    expect(compositeScore(a, c1)).toBeGreaterThan(compositeScore(a, c2));
  });
});

