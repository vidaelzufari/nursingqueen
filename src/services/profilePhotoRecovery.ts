import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { babyRepository } from '@/db/repositories/babyRepository';
import { persistProfilePhoto } from './profilePhoto';

/** Rebase legacy absolute picker paths after an iOS sandbox change, without deleting data. */
export async function recoverProfilePhotos(): Promise<void> {
  if (Platform.OS === 'web') return;
  for (const baby of babyRepository.listAll()) {
    const original = baby.photoUri;
    if (!original?.startsWith('file://')) continue;
    const candidates = [original];
    for (const [marker, directory] of [
      ['/Library/Caches/', FileSystem.cacheDirectory],
      ['/Documents/', FileSystem.documentDirectory],
    ] as const) {
      const offset = original.indexOf(marker);
      if (offset < 0 || !directory) continue;
      const suffix = original.slice(offset + marker.length);
      if (suffix && !suffix.split('/').some(part => part === '..' || part === '.')) candidates.push(directory + suffix);
    }
    for (const candidate of [...new Set(candidates)]) {
      try {
        const info = await FileSystem.getInfoAsync(candidate);
        if (!info.exists || info.isDirectory) continue;
        const reference = await persistProfilePhoto(candidate);
        if (babyRepository.getById(baby.id)?.photoUri === original) babyRepository.update(baby.id, { photoUri: reference });
        break;
      } catch { /* Missing or purged cache photos must not block startup or erase the reference. */ }
    }
  }
}
