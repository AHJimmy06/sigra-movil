import { canSyncResident, homeForUser, isMobileUser } from './session-role';
const resident = { sub: 'r', email: 'r@example.test', role: 'RESIDENT' as const, residentId: 'resident-id' };
const guard = { sub: 'g', email: 'g@example.test', role: 'GUARD' as const };
test('guard/resident routes and synchronization are isolated', () => {
  expect(homeForUser(guard)).toBe('/(guard)/scanner');
  expect(homeForUser(resident)).toBe('/(tabs)');
  expect(homeForUser(null)).toBe('/login');
  expect(canSyncResident(guard, 'token')).toBe(false);
  expect(canSyncResident(resident, 'token')).toBe(true);
  expect(canSyncResident(resident, null)).toBe(false);
});
test('malformed or unauthorized stored user shapes are rejected', () => {
  expect(isMobileUser(guard)).toBe(true);
  expect(isMobileUser(resident)).toBe(true);
  expect(isMobileUser({ ...resident, residentId: null })).toBe(false);
  expect(isMobileUser({ ...guard, role: 'ADMIN' })).toBe(false);
  expect(isMobileUser({ ...guard, sub: '' })).toBe(false);
});
