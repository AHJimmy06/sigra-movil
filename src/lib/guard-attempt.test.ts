import { parseGuardQr, createGuardAttempt } from './guard-attempt';
const qr = JSON.stringify({ v: 1, passId: 'pass-1', token: '123456' });
test('scanning validates structure without creating an access event', () => {
  expect(parseGuardQr(qr)).toBe(qr);
  for (const raw of [
    'null',
    '{}',
    '{',
    JSON.stringify({ v: 1, passId: 'x', token: 123456 }),
  ])
    expect(() => parseGuardQr(raw)).toThrow();
});
test('confirmation trims visitor and reuses identity only for identical retries', () => {
  let id = 0;
  const attempt = createGuardAttempt(() => `id-${++id}`);
  expect(() => attempt(qr, ' ', 'ENTRY')).toThrow();
  const first = attempt(qr, ' Ana ', 'ENTRY');
  expect(first.visitorName).toBe('Ana');
  expect(attempt(qr, 'Ana', 'ENTRY')).toEqual(first);
  expect(attempt(qr, 'Ana', 'EXIT').clientEventId).not.toBe(
    first.clientEventId,
  );
  expect(attempt(qr, 'Luis', 'EXIT').clientEventId).toBe('id-3');
  expect(() => attempt(qr, 'a'.repeat(121), 'ENTRY')).toThrow();
});
