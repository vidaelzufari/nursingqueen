import { act, renderHook } from '@testing-library/react-native';
import { useMinimumLaunchTime } from '@/hooks/useMinimumLaunchTime';
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
it('keeps the branded launch screen visible for at least two seconds', () => {
  const {result}=renderHook(() => useMinimumLaunchTime());
  expect(result.current).toBe(false);
  act(() => jest.advanceTimersByTime(1999)); expect(result.current).toBe(false);
  act(() => jest.advanceTimersByTime(1)); expect(result.current).toBe(true);
});
it('cleans up its delay if the application unmounts during startup', () => {
  const {unmount}=renderHook(() => useMinimumLaunchTime());
  unmount(); expect(jest.getTimerCount()).toBe(0);
});
