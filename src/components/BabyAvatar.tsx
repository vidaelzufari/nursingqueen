import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { profilePhotoUri } from '@/services/profilePhoto';
import { Icon } from './Icon';

/** Never leave an empty hole when an old cache photo is missing or still loading. */
export function BabyAvatar({ uri, size = 56, label }: { uri?: string | null; size?: number; label: string }) {
  const theme = useTheme();
  const source = profilePhotoUri(uri);
  const [failed, setFailed] = useState<string | null>(null);
  return <View testID="baby-avatar" accessible accessibilityLabel={label} style={{ width: size, height: size, borderRadius: size / 2, flexShrink: 0, overflow: 'hidden', backgroundColor: theme.colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
    <Icon name="baby" size={Math.round(size * .46)} color={theme.colors.accent} />
    {source && failed !== source ? <Image testID="baby-avatar-image" source={{ uri: source }} accessible={false} resizeMode="cover" onError={() => setFailed(source)} style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2 }} /> : null}
  </View>;
}
