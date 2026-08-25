import { createAccessPayload, generateTotp } from './totp';

describe('TOTP access payload', () => {
  it('matches the RFC 6238 SHA1 vector truncated to six digits', () => {
    expect(generateTotp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000, 30, 6)).toBe('287082');
  });

  it('serializes the versioned server-compatible contract', () => {
    expect(JSON.parse(createAccessPayload('pass-1', 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000))).toEqual({
      v: 1,
      passId: 'pass-1',
      token: '287082',
    });
  });
});
