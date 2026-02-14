import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { buildAffiliateCodeSeed, formatAffiliateCode } from '../src/lib/affiliate-utils';

describe('affiliate-utils', () => {
  it('formats affiliate codes to uppercase alphanumerics', () => {
    const result = formatAffiliateCode('viking-labs 2025!');
    assert.equal(result, 'VIKINGLABS2025');
  });

  it('builds code seed from name and email', () => {
    const result = buildAffiliateCodeSeed('Jane Doe', 'jane@example.com');
    assert.ok(result.startsWith('JAN'));
    assert.ok(result.includes('JANE'));
  });
});
