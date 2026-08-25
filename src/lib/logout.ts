import type { SQLiteDatabase } from 'expo-sqlite';
import { clearResidentData } from './db';
import { deleteLocalPhoto } from './photos';
import { preferences } from './preferences';
import { secure } from './secure';
import { useSession } from '@/store/session';

export async function logout(db: SQLiteDatabase) {
  const local = await clearResidentData(db);
  await Promise.all(local.passes.map((pass) => secure.deletePass(pass.id)));
  for (const ticket of local.tickets) deleteLocalPhoto(ticket.imageUri);
  await secure.clearSession();
  preferences.clearResidentMetadata();
  useSession.getState().clear();
}
