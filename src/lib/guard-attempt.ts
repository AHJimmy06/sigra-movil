export type Direction = 'ENTRY' | 'EXIT';
export type GuardValidation = {
  qrPayload: string;
  clientEventId: string;
  direction: Direction;
  visitorName: string;
};
export function parseGuardQr(raw: string): string {
  if (raw.length > 2048) throw new Error('El código QR no es válido.');
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('El código QR no es válido.');
  }
  if (!value || typeof value !== 'object')
    throw new Error('El código QR no es válido.');
  const payload = value as Record<string, unknown>;
  if (
    payload.v !== 1 ||
    typeof payload.passId !== 'string' ||
    !payload.passId.trim() ||
    typeof payload.token !== 'string' ||
    !/^\d{6}$/.test(payload.token)
  )
    throw new Error('El código QR no es válido.');
  return raw;
}
// Memory-only: never save scanned credentials or retry identities to disk.
export function createGuardAttempt(newId: () => string) {
  let previous: GuardValidation | undefined;
  return (
    qrPayload: string,
    name: string,
    direction: Direction,
  ): GuardValidation => {
    parseGuardQr(qrPayload);
    const visitorName = name.trim();
    if (!visitorName || visitorName.length > 120)
      throw new Error(
        'Ingrese el nombre del visitante (máximo 120 caracteres).',
      );
    if (
      previous?.qrPayload === qrPayload &&
      previous.visitorName === visitorName &&
      previous.direction === direction
    )
      return previous;
    previous = { qrPayload, visitorName, direction, clientEventId: newId() };
    return previous;
  };
}
