import React from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { FoodPhoto } from './FoodPhoto';
import { foodName } from '@/domain/foods';

type Food = { id: string; catalogKey?: string | null; name?: string | null; photoUri?: string | null };
/** Shared removable food chips keep a meal draft visible while searching again. */
export function FoodSelection({ ids, foods, language, onRemove }: { ids: string[]; foods: Food[]; language: string; onRemove: (id: string) => void }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {ids.map(id => {
      const food = foods.find(item => item.id === id) ?? { id };
      const name = foodName(food, language);
      return <Button key={id} compact label={'× ' + name} variant="soft"
        icon={<FoodPhoto id={food.catalogKey ?? id} uri={food.photoUri} label={name} size={28} />}
        onPress={() => onRemove(id)} />;
    })}
  </View>;
}
