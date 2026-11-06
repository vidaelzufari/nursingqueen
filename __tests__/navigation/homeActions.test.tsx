import { useBabyStore } from "@/store/useBabyStore";
import { babyRepository } from "@/db/repositories";
import React from "react";
import { Text } from "react-native";
import { act, render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../../app/index";
import { SessionDock } from "@/components/SessionDock";
import { AppShell } from "@/navigation/AppShell";
import { palettes, spacing, radii, typeScale, shadows } from "@/theme/tokens";

const mockPush = jest.fn();
const mockStartNursing = jest.fn();
const mockState = {
  nursingSessions: [] as { id: string; startedAt: string; endedAt: string | null }[], pumpEvents: [], bottleEvents: [],
  openNursingSession: () => null,
  startNursing: mockStartNursing, stopNursing: jest.fn(), logPump: jest.fn(),
};
const mockTheme = { colors: palettes.light, spacing, radii, type: typeScale, shadows, mode: "light" };
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }), usePathname: () => "/" }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/theme/ThemeProvider", () => ({ useTheme: () => mockTheme }));
jest.mock("@/db/repositories", () => ({ babyRepository: { listAll: jest.fn(() => []), create: jest.fn() } }));
jest.mock("@/store/useLogStore", () => ({
  ...jest.requireActual("@/store/useLogStore"),
  useLogStore: Object.assign((selector: (state: typeof mockState) => unknown) => selector(mockState), { getState: () => ({ ...mockState, babyId: "baby", refresh: jest.fn() }) }),
}));
jest.mock("@/store/useBabyStore", () => {
  const actual = jest.requireActual("@/store/useBabyStore");
  return actual;
});
jest.mock("@/store/useSettingsStore", () => ({ useSettingsStore: Object.assign((selector: (state: object) => unknown) => selector({ unit: "ml", activeBabyId: "baby" }), { getState: () => ({ activeBabyId: "baby", setActiveBabyId: jest.fn() }) }) }));
jest.mock("@/store/useStashStore", () => ({ useStashStore: (selector: (state: object) => unknown) => selector({ items: [] }) }));
jest.mock("@/store/useSleepStore", () => ({ useSleepStore: Object.assign((selector: (state: object) => unknown) => selector({ sessions: [], start: jest.fn(), stop: jest.fn() }), { getState: () => ({ babyId: "baby", refresh: jest.fn() }) }) }));
jest.mock("@/components/Forecasts", () => ({ Forecasts: () => null }));
jest.mock("@/components/WeeklySummary", () => ({ WeeklySummary: () => null }));
jest.mock("@/components/RecentActivities", () => ({ RecentActivities: () => null }));

const baby = { id: "baby", name: "Baby", dateOfBirth: "2026-01-01", photoUri: null, sortOrder: 0, createdAt: "2026-01-01" };
beforeEach(() => {
  jest.clearAllMocks();
  useBabyStore.setState({ babies: [baby], loaded: true });
  (babyRepository.listAll as jest.Mock).mockReturnValue([baby]);
});
it("starts nursing without navigating away from Home", () => {
  const screen = render(<HomeScreen />);
  fireEvent.press(screen.getByTestId("home-button-start-nursing"));
  expect(mockStartNursing).toHaveBeenCalledTimes(1);
  expect(mockPush).not.toHaveBeenCalled();
});
it("opens Settings only when its own navigation button is pressed", () => {
  const screen = render(<AppShell><Text>Content</Text></AppShell>);
  fireEvent.press(screen.getByTestId("nav-settings"));
  expect(mockPush).toHaveBeenCalledWith("/settings");
});

it("keeps nursing controls available while browsing and stops the existing session", () => {
  mockState.nursingSessions = [{ id: "active", startedAt: new Date(Date.now() - 120000).toISOString(), endedAt: null }];
  try {
    const screen = render(<SessionDock />);
    expect(screen.getByText("00:02:00")).toBeTruthy();
    fireEvent.press(screen.getByTestId("session-stop-nursing"));
    expect(mockState.stopNursing).toHaveBeenCalledTimes(1);
    expect(mockStartNursing).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  } finally { mockState.nursingSessions = []; }
});

it("uses a profile saved while Home is mounted without redirecting Nurse to setup", () => {
  useBabyStore.setState({ babies: [] });
  const screen = render(<HomeScreen />);
  (babyRepository.create as jest.Mock).mockReturnValue(baby);
  act(() => useBabyStore.getState().createBaby({ name: baby.name, dateOfBirth: baby.dateOfBirth }));
  fireEvent.press(screen.getByTestId("home-button-start-nursing"));
  expect(mockStartNursing).toHaveBeenCalledTimes(1);
  expect(mockPush).not.toHaveBeenCalled();
});
it("only opens profile setup when no baby exists on this device", () => {
  useBabyStore.setState({ babies: [] });
  (babyRepository.listAll as jest.Mock).mockReturnValue([]);
  const screen = render(<HomeScreen />);
  fireEvent.press(screen.getByTestId("home-button-start-nursing"));
  expect(mockStartNursing).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith({ pathname: "/profile/edit", params: { intent: "nurse" } });
});

it("recovers a saved profile before routing Bottle even if the mounted state was empty", () => {
  useBabyStore.setState({ babies: [] });
  const screen = render(<HomeScreen />);
  fireEvent.press(screen.getByTestId("home-button-bottle"));
  expect(mockPush).toHaveBeenCalledWith("/modals/bottle-entry");
  expect(mockPush).not.toHaveBeenCalledWith("/profile/edit");
});
