import {parseFoodSuggestions,foodIdForEditedName,parseMealFoodIds} from '@/domain/foodRecognition';
it('keeps suggestions editable, deduplicated and treats unknown catalogue IDs as untrusted',()=>{
 const input={foods:[{name:' Carotte ',catalogId:'invented',certainty:'likely'},{name:'carotte',catalogId:null,certainty:'uncertain'}]};
 expect(parseFoodSuggestions(input)).toEqual([{name:'Carotte',catalogId:null,certainty:'likely'}]);expect(input.foods[0]?.name).toBe(' Carotte ');
});
it('uses the corrected name rather than a model catalogue guess',()=>{
 expect(foodIdForEditedName('courgette')).toBe('zucchini');expect(foodIdForEditedName('purée maison')).toBeNull();expect(foodIdForEditedName('جزر')).toBe('carrot');
});
it.each([null,{}, {foods:'carrot'},{foods:[null]},{foods:[{name:'',certainty:'likely'}]},{foods:[{name:'x'.repeat(81),certainty:'likely'}]},{foods:[{name:'Carrot',certainty:'certain'}]},{foods:Array(13).fill({name:'Carrot',certainty:'likely'})}])('rejects malformed AI response %j',input=>{expect(()=>parseFoodSuggestions(input)).toThrow('invalid_response');});
it('allows no recognized foods instead of inventing ingredients',()=>expect(parseFoodSuggestions({foods:[]})).toEqual([]));
it.each([undefined,'invalid','{}','null'])('safely handles malformed meal handoff %s',input=>expect(parseMealFoodIds(input)).toEqual([]));
it('deduplicates and bounds photo-to-meal handoff',()=>{
 expect(parseMealFoodIds(JSON.stringify(['carrot','carrot',null,12,'zucchini']))).toEqual(['carrot','zucchini']);
 expect(parseMealFoodIds(JSON.stringify(Array.from({length:20},(_,i)=>String(i))))).toHaveLength(12);
});
