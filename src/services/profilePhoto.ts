import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { generateId } from '@/db/id';

const prefix = 'profile-photo:';
/** Relative references survive iOS replacing the application's sandbox path on update. */
export function profilePhotoUri(reference?: string | null): string | null {
  if (!reference) return null;
  if (!reference.startsWith(prefix)) return reference;
  const filename = reference.slice(prefix.length);
  return FileSystem.documentDirectory && /^[a-zA-Z0-9-]+\.(jpg|jpeg|png|heic|webp)$/.test(filename)
    ? `${FileSystem.documentDirectory}profile-photos/${filename}` : null;
}

export async function persistProfilePhoto(uri: string, base64?: string | null): Promise<string> {
  if (Platform.OS === 'web') {
    if (!base64) throw new Error('Photo data missing');
    return `data:image/jpeg;base64,${base64}`;
  }
  if (!FileSystem.documentDirectory) throw new Error('Photo storage unavailable');
  const extension = uri.split(/[?#]/)[0]?.match(/\.(jpg|jpeg|png|heic|webp)$/i)?.[1]?.toLowerCase() ?? 'jpg';
  const filename = `${generateId()}.${extension}`;
  const directory = `${FileSystem.documentDirectory}profile-photos/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  await FileSystem.copyAsync({ from: uri, to: directory + filename });
  return prefix + filename;
}
