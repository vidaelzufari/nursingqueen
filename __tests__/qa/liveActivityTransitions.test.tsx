import React from 'react';
import { AppState, Platform } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { TimerIntegrations } from '@/components/TimerIntegrations';

const mockData = new Map<string, string>();
const mockStart = jest.fn(); const mockStop = jest.fn(); const mockUpdate = jest.fn();
let mockNursing = [{ id: 'n1', startedAt: '2026-11-26T10:00:00Z', endedAt: null }];
let mockSleep = [{ id: 's1', startedAt: '2026-11-26T09:00:00Z', endedAt: null, period: 'nap' }];
const mockT = (key: string) => key;
const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT, i18n: { language: 'en' } }) }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: async (k: string) => mockData.get(k) ?? null, setItem: async (k: string, v: string) => { mockData.set(k, v); } }));
jest.mock('@/store/useLogStore', () => ({ useLogStore: (select: (s: object) => unknown) => select({ nursingSessions: mockNursing }) }));
jest.mock('@/store/useSleepStore', () => ({ useSleepStore: (select: (s: object) => unknown) => select({ sessions: mockSleep }) }));
jest.mock('@/store/useSettingsStore', () => ({ useSettingsStore: (select: (s: object) => unknown) => select({ timerReminders: false, liveActivities: true }) }));
jest.mock('expo-live-activity', () => ({ startActivity: (...args: unknown[]) => mockStart(...args), stopActivity: (...args: unknown[]) => mockStop(...args), updateActivity: (...args: unknown[]) => mockUpdate(...args) }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(), addNotificationResponseReceivedListener: () => ({ remove: jest.fn() }), getLastNotificationResponseAsync: async () => null,
  getPermissionsAsync: async () => { throw Error('Notification service unavailable'); },
}));

it('keeps concurrent timers independent when correcting a nap to night sleep and ending both', async () => {
  const version = Object.getOwnPropertyDescriptor(Platform, 'Version');
  const state = Object.getOwnPropertyDescriptor(AppState, 'currentState');
  Object.defineProperty(Platform, 'Version', { configurable: true, value: '17.0' });
  Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
  mockData.clear();mockStart.mockImplementation(() => 'activity-' + mockStart.mock.calls.length);
  const screen = render(<TimerIntegrations />);
  try {
    await waitFor(() => expect(JSON.parse(mockData.get('nq-live-session-ids') ?? '{}').s1.kind).toBe('nap'));
    expect(mockStart).toHaveBeenCalledTimes(2);
    expect(mockStart.mock.calls[1][1].deepLinkUrl).toBe('nursingqueen:///sleep?period=nap');
    mockSleep = [{ ...mockSleep[0]!, period: 'night' }];screen.rerender(<TimerIntegrations />);
    await waitFor(() => expect(JSON.parse(mockData.get('nq-live-session-ids') ?? '{}').s1.kind).toBe('night'));
    expect(mockStop).toHaveBeenCalledWith('activity-2', expect.anything());
    expect(mockStart).toHaveBeenCalledTimes(3);
    expect(mockStart.mock.calls[2][1].deepLinkUrl).toBe('nursingqueen:///sleep?period=night');
    expect(mockUpdate).toHaveBeenCalledWith('activity-1', expect.anything());
    mockNursing = [];mockSleep = [];screen.rerender(<TimerIntegrations />);
    await waitFor(() => expect(mockData.get('nq-live-session-ids')).toBe('{}'));
    expect(mockStop).toHaveBeenCalledWith('activity-1', expect.anything());
    expect(mockStop).toHaveBeenCalledWith('activity-3', expect.anything());
  } finally {
    screen.unmount();
    if (version) Object.defineProperty(Platform, 'Version', version);
    if (state) Object.defineProperty(AppState, 'currentState', state);
  }
});

it('recreates a saved activity removed by iOS on the first synchronization, keeping the original timer start', async () => {
  const version = Object.getOwnPropertyDescriptor(Platform, 'Version');
  const state = Object.getOwnPropertyDescriptor(AppState, 'currentState');
  Object.defineProperty(Platform, 'Version', { configurable: true, value: '17.0' });
  Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
  mockNursing = [{ id: 'n1', startedAt: '2026-11-26T10:00:00Z', endedAt: null }];
  mockSleep = [{ id: 's1', startedAt: '2026-11-26T09:00:00Z', endedAt: null, period: 'nap' }];
  mockData.clear();
  mockData.set('nq-live-session-ids', JSON.stringify({
    n1: { id: 'missing', start: mockNursing[0]!.startedAt, kind: 'nursing' },
    s1: { id: 'still-active', start: mockSleep[0]!.startedAt, kind: 'nap' },
  }));
  mockStart.mockReset(); mockUpdate.mockReset(); mockStop.mockReset();
  mockStart.mockReturnValue('replacement');
  mockUpdate.mockImplementation((id: string) => { if (id === 'missing') throw Error('Activity not found'); });
  mockStop.mockImplementation((id: string) => { if (id === 'missing') throw Error('Activity not found'); });
  const screen = render(<TimerIntegrations />);
  try {
    await waitFor(() => expect(JSON.parse(mockData.get('nq-live-session-ids') ?? '{}').n1.id).toBe('replacement'));
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart.mock.calls[0][0].progressBar.date).toBe(Date.parse(mockNursing[0]!.startedAt));
    expect(mockUpdate).toHaveBeenCalledWith('still-active', expect.anything());
    expect(mockStop).not.toHaveBeenCalledWith('still-active', expect.anything());
    expect(JSON.parse(mockData.get('nq-live-session-ids') ?? '{}').s1.id).toBe('still-active');
  } finally {
    screen.unmount();
    mockStart.mockReset(); mockUpdate.mockReset(); mockStop.mockReset();
    if (version) Object.defineProperty(Platform, 'Version', version);
    if (state) Object.defineProperty(AppState, 'currentState', state);
  }
});
