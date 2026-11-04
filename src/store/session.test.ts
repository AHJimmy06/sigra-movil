import { api } from '@/lib/api';
import { secure } from '@/lib/secure';
import { useSession } from './session';

jest.mock('@/lib/api', () => ({ api: { login: jest.fn() } }));
jest.mock('@/lib/secure', () => ({
  secure: { saveSession: jest.fn(), loadSession: jest.fn(), clearSession: jest.fn() },
}));

const login = api.login as jest.Mock;
const load = secure.loadSession as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); useSession.getState().clear(); });

test('a guard can sign in and restore without a resident identity', async () => {
  const user = { sub: 'guard-id', email: 'guard@example.test', role: 'GUARD', residentId: null };
  login.mockResolvedValue({ accessToken: 'guard-token', user });
  await useSession.getState().login(' GUARD@example.test ', 'local-password');
  expect(login).toHaveBeenCalledWith('guard@example.test', 'local-password');
  expect(secure.saveSession).toHaveBeenCalledWith('guard-token', user);
  expect(useSession.getState().user).toEqual(user);
  load.mockResolvedValue({ token: 'guard-token', user });
  await useSession.getState().restore();
  expect(useSession.getState().status).toBe('authenticated');
});

test('resident login remains supported and requires its resident identity', async () => {
  const user = { sub: 'resident-user', email: 'resident@example.test', role: 'RESIDENT', residentId: 'resident-id' };
  login.mockResolvedValue({ accessToken: 'resident-token', user });
  await useSession.getState().login(user.email, 'local-password');
  expect(useSession.getState().user).toEqual(user);
  login.mockResolvedValue({ accessToken: 'bad-token', user: { ...user, residentId: null } });
  await expect(useSession.getState().login(user.email, 'local-password')).rejects.toThrow();
});

test('admin accounts are not admitted to mobile guard or resident routes', async () => {
  const user = { sub: 'admin', email: 'admin@example.test', role: 'ADMIN' };
  login.mockResolvedValue({ accessToken: 'admin-token', user });
  await expect(useSession.getState().login(user.email, 'local-password')).rejects.toThrow();
  expect(secure.saveSession).not.toHaveBeenCalled();
  load.mockResolvedValue({ token: 'admin-token', user });
  await useSession.getState().restore();
  expect(useSession.getState().status).toBe('anonymous');
  expect(secure.clearSession).toHaveBeenCalled();
});
