import React from 'react';
import {useTranslation} from 'react-i18next';
import {AllergenId,foodAllergens} from '@/domain/allergens';
import { View } from 'react-native';
import { Button } from './Button';
import { FoodPhoto } from './FoodPhoto';
import { foodName } from '@/domain/foods';

type Food = { id: string; catalogKey?: string | null; name?: string | null; photoUri?: string | null;allergens?:AllergenId[] };
/** Shared removable food chips keep a meal draft visible while searching again. */
export function FoodSelection({ ids, foods, language, onRemove }: { ids: string[]; foods: Food[]; language: string; onRemove: (id: string) => void }) {
  const {t}=useTranslation();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {ids.map(id => {
      const food = foods.find(item => item.id === id) ?? { id };
      const name = foodName(food, language);
      return <Button key={id} compact label={'× ' + name + (foodAllergens(food).length ? ' · '+t('allergens.badge') : '')} variant="soft"
        icon={<FoodPhoto id={food.catalogKey ?? id} uri={food.photoUri} label={name} size={28} />}
        onPress={() => onRemove(id)} />;
    })}
  </View>;
}
