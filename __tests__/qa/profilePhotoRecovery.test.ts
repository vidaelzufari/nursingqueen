import { Platform } from 'react-native';
import * as FS from 'expo-file-system';
import { babyRepository } from '@/db/repositories/babyRepository';
import { recoverProfilePhotos } from '@/services/profilePhotoRecovery';
const original='file:///old-container/Library/Caches/ImagePicker/baby.jpg';
const mockUpdate=jest.fn();
jest.mock('expo-file-system',()=>({documentDirectory:'file:///current/Documents/',cacheDirectory:'file:///current/Library/Caches/',getInfoAsync:jest.fn(),makeDirectoryAsync:jest.fn(),copyAsync:jest.fn()}));
jest.mock('@/db/repositories/babyRepository',()=>({babyRepository:{listAll:jest.fn(),getById:jest.fn(),update:(...args:unknown[])=>mockUpdate(...args)}}));
beforeEach(()=>{jest.clearAllMocks();Object.defineProperty(Platform,'OS',{configurable:true,value:'ios'});(babyRepository.listAll as jest.Mock).mockReturnValue([{id:'baby',photoUri:original}]);(babyRepository.getById as jest.Mock).mockReturnValue({photoUri:original});});
it('recovers a surviving cache photo in the new sandbox and persists a relative reference',async()=>{
 (FS.getInfoAsync as jest.Mock).mockImplementation(async uri=>({exists:uri==='file:///current/Library/Caches/ImagePicker/baby.jpg',isDirectory:false}));
 await recoverProfilePhotos();expect(FS.copyAsync).toHaveBeenCalledWith(expect.objectContaining({from:'file:///current/Library/Caches/ImagePicker/baby.jpg'}));expect(mockUpdate).toHaveBeenCalledWith('baby',{photoUri:expect.stringMatching(/^profile-photo:/)});
});
it('preserves the reference when the operating system has purged the photo',async()=>{
 (FS.getInfoAsync as jest.Mock).mockResolvedValue({exists:false});await recoverProfilePhotos();expect(mockUpdate).not.toHaveBeenCalled();expect(FS.copyAsync).not.toHaveBeenCalled();
});
it('does not overwrite a profile changed while recovery was running',async()=>{
 (FS.getInfoAsync as jest.Mock).mockResolvedValue({exists:true,isDirectory:false});(babyRepository.getById as jest.Mock).mockReturnValue({photoUri:'profile-photo:new.jpg'});await recoverProfilePhotos();expect(mockUpdate).not.toHaveBeenCalled();
});
