import React from "react";
import { Text as MockText } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import HistoryScreen from "../../app/history";
import { palettes, spacing, radii, typeScale, shadows } from "@/theme/tokens";

const mockTheme = { colors: palettes.light, spacing, radii, type: typeScale, shadows };
jest.mock("@/theme/ThemeProvider", () => ({ useTheme: () => mockTheme }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/navigation/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@/components/PageHeader", () => ({ PageHeader: () => null }));
jest.mock("@/components", () => ({
  Button: () => null,
  EntryRow: ({ title, detailLabel }: { title: string; detailLabel: string }) => <MockText>{title} {detailLabel}</MockText>,
}));
jest.mock("@/store/useSettingsStore", () => ({ useSettingsStore: (s: (v: object) => unknown) => s({ unit: "ml" }) }));
jest.mock("@/store/useSleepStore", () => ({ useSleepStore: (s: (v: object) => unknown) => s({ sessions: [] }) }));
jest.mock("@/store/useLogStore", () => ({ useLogStore: (s: (v: object) => unknown) => s({
  nursingSessions: [{ id: "nurse", side: "unknown", startedAt: "2026-11-20T10:00:00Z", durationSeconds: 600, note: "Garden" }],
  pumpEvents: [{ id: "pump", startedAt: "2026-11-20T09:00:00Z", totalMl: 90, needsDetail: false, note: "Office" }],
  bottleEvents: [],
}) }));

it("combines the selected activity with a note search and restores the list when cleared", () => {
  const screen = render(<HistoryScreen />);
  const search = screen.getByLabelText("refresh.search");
  fireEvent.changeText(search, "garden");
  expect(screen.getByText(/history.nursingTitle/)).toBeTruthy();
  expect(screen.queryByText(/history.pumpTitle/)).toBeNull();
  fireEvent.press(screen.getByText("refresh.pump"));
  expect(screen.getByText("refresh.emptySearch")).toBeTruthy();
  fireEvent.changeText(search, "OFFICE");
  expect(screen.getByText(/history.pumpTitle/)).toBeTruthy();
  fireEvent.changeText(search, "");
  fireEvent.press(screen.getByText("refresh.all"));
  expect(screen.getByText(/history.nursingTitle/)).toBeTruthy();
  expect(screen.getByText(/history.pumpTitle/)).toBeTruthy();
});
