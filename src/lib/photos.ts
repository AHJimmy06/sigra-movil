import { Directory, File, Paths } from 'expo-file-system';

export async function copyTicketPhoto(sourceUri: string, clientRequestId: string) {
  const directory = new Directory(Paths.document, 'ticket-images');
  directory.create({ idempotent: true, intermediates: true });
  const source = new File(sourceUri);
  const extension = source.extension || '.jpg';
  const destination = new File(directory, `${clientRequestId}${extension}`);
  await source.copy(destination);
  return destination.uri;
}

export function deleteLocalPhoto(uri: string) {
  const file = new File(uri);
  if (file.exists) file.delete();
}
