import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../../app/index";
import { AppShell } from "@/navigation/AppShell";
import { palettes, spacing, radii, typeScale, shadows } from "@/theme/tokens";

const mockPush = jest.fn();
const mockStartNursing = jest.fn();
const mockState = {
  nursingSessions: [], pumpEvents: [], bottleEvents: [],
  openNursingSession: () => null,
  startNursing: mockStartNursing, stopNursing: jest.fn(), logPump: jest.fn(),
};
const mockTheme = { colors: palettes.light, spacing, radii, type: typeScale, shadows, mode: "light" };
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }), usePathname: () => "/" }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/theme/ThemeProvider", () => ({ useTheme: () => mockTheme }));
jest.mock("@/store/useLogStore", () => ({
  ...jest.requireActual("@/store/useLogStore"),
  useLogStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));
jest.mock("@/store/useBabyStore", () => ({ useBabyStore: (selector: (state: object) => unknown) => selector({ activeBaby: () => ({ id: "baby", name: "Baby", dateOfBirth: "2026-01-01" }) }) }));
jest.mock("@/store/useSettingsStore", () => ({ useSettingsStore: (selector: (state: object) => unknown) => selector({ unit: "ml" }) }));
jest.mock("@/store/useStashStore", () => ({ useStashStore: (selector: (state: object) => unknown) => selector({ items: [] }) }));
jest.mock("@/store/useSleepStore", () => ({ useSleepStore: (selector: (state: object) => unknown) => selector({ sessions: [], start: jest.fn(), stop: jest.fn() }) }));
jest.mock("@/components/Forecasts", () => ({ Forecasts: () => null }));
jest.mock("@/components/WeeklySummary", () => ({ WeeklySummary: () => null }));
jest.mock("@/components/RecentActivities", () => ({ RecentActivities: () => null }));

beforeEach(() => jest.clearAllMocks());
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
