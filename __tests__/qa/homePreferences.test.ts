import storage from "@react-native-async-storage/async-storage";
import { HOME_ACTIVITIES, normalizeHomeActivities, toggleHomeActivity, visibleHomeActivities } from '@/domain/homePreferences';
import { useSettingsStore } from '@/store/useSettingsStore';
it.each(Array.from({length:31},(_,i)=>i+1))('supports and persists nonempty combination %i',mask=>{
 const selected=HOME_ACTIVITIES.filter((_,i)=>mask & (1<<i));
 expect(normalizeHomeActivities(selected)).toEqual(selected);
 useSettingsStore.getState().setHomeActivities(selected);
 expect(useSettingsStore.getState().homeActivities).toEqual(selected);
 for(const key of HOME_ACTIVITIES){const result=toggleHomeActivity(selected,key);expect(result.length).toBeGreaterThan(0);expect(result.includes(key)).toBe(selected.length===1 && selected.includes(key) ? true : !selected.includes(key));}
});
it.each([undefined,null,[],['invalid'],42])('restores all activities for invalid/legacy preference %j',value=>{expect(normalizeHomeActivities(value)).toEqual(HOME_ACTIVITIES);});
it('normalizes order and removes duplicates and unknown keys',()=>{expect(normalizeHomeActivities(['sleep','bottle','bottle','invalid'])).toEqual(['bottle','sleep']);});
it('retains both hidden live sessions but hides them once finished',()=>{
 expect(visibleHomeActivities(['bottle'],{nursing:true,sleep:true})).toEqual(['nursing','bottle','sleep']);
 expect(visibleHomeActivities(['bottle'],{})).toEqual(['bottle']);
});
it('stores the selection in AsyncStorage and restores it on hydration',async()=>{
 useSettingsStore.getState().setHomeActivities(['bottle','sleep']);
 const saved=await storage.getItem('nursing-queen-settings');
 expect(JSON.parse(saved!).state.homeActivities).toEqual(['bottle','sleep']);
 await useSettingsStore.persist.rehydrate();
 expect(useSettingsStore.getState().homeActivities).toEqual(['bottle','sleep']);
});
