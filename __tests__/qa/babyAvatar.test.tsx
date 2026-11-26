import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BabyAvatar } from '@/components/BabyAvatar';
import { palettes } from '@/theme/tokens';
const mockTheme = { colors: palettes.light };
jest.mock('@/theme/ThemeProvider', () => ({ useTheme: () => mockTheme }));
it('replaces a missing cached photo with a visible baby avatar and retries a new selection', () => {
  const screen = render(<BabyAvatar uri="file:///old-cache/photo.jpg" label="Baby" />);
  fireEvent(screen.getByTestId('baby-avatar-image'), 'error');
  expect(screen.queryByTestId('baby-avatar-image')).toBeNull();
  expect(screen.getByTestId('baby-avatar')).toBeTruthy();
  screen.rerender(<BabyAvatar uri="file:///new-cache/photo.jpg" label="Baby" />);
  expect(screen.getByTestId('baby-avatar-image').props.source.uri).toBe('file:///new-cache/photo.jpg');
});
it('keeps the fallback visible when there is no photo', () => {
  const screen = render(<BabyAvatar label="Baby" />);
  expect(screen.getByLabelText('Baby')).toBeTruthy();
  expect(screen.queryByTestId('baby-avatar-image')).toBeNull();
});
