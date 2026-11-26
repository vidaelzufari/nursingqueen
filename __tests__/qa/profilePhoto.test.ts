import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { persistProfilePhoto, profilePhotoUri } from '@/services/profilePhoto';
jest.mock('expo-file-system', () => ({ documentDirectory: 'file:///current-sandbox/Documents/', makeDirectoryAsync: jest.fn(async () => {}), copyAsync: jest.fn(async () => {}) }));
const os = Platform.OS;
afterEach(() => { Object.defineProperty(Platform, 'OS', { configurable: true, value: os }); jest.clearAllMocks(); });
it('copies native picker cache photos to durable documents and stores a relative reference', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  const ref = await persistProfilePhoto('file:///cache/photo.jpg');
  expect(ref).toMatch(/^profile-photo:[a-z0-9-]+\.jpg$/);
  expect(FileSystem.copyAsync).toHaveBeenCalledWith({ from: 'file:///cache/photo.jpg', to: profilePhotoUri(ref) });
  expect(profilePhotoUri(ref)).toContain('file:///current-sandbox/Documents/profile-photos/');
});
it('does not accept path traversal in relative photo references', () => {
  expect(profilePhotoUri('profile-photo:../secret.jpg')).toBeNull();
  expect(profilePhotoUri('file:///legacy/cache.jpg')).toBe('file:///legacy/cache.jpg');
});
it('keeps web photos after the temporary blob URL disappears', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  expect(await persistProfilePhoto('blob:temporary', 'example')).toBe('data:image/jpeg;base64,example');
  await expect(persistProfilePhoto('blob:temporary')).rejects.toThrow();
  expect(FileSystem.copyAsync).not.toHaveBeenCalled();
});
