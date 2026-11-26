import {foodRecognitionConfigured,recognizeFoodPhoto} from '@/services/foodRecognition';
const mockFetch=jest.fn();
const originalFetch=global.fetch;
const originalFlag=process.env.EXPO_PUBLIC_FOOD_AI_ENABLED;
afterEach(()=>{global.fetch=originalFetch;if(originalFlag===undefined)delete process.env.EXPO_PUBLIC_FOOD_AI_ENABLED;else process.env.EXPO_PUBLIC_FOOD_AI_ENABLED=originalFlag;});
it('does not create a guest session or transmit a photo while recognition is not released',async()=>{
 process.env.EXPO_PUBLIC_FOOD_AI_ENABLED='false';global.fetch=mockFetch;
 expect(foodRecognitionConfigured()).toBe(false);
 await expect(recognizeFoodPhoto('synthetic','fr')).rejects.toThrow('not_configured');
 expect(mockFetch).not.toHaveBeenCalled();
});
