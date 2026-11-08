import React from "react";
import { TextInput } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import EditEntry from "../../app/entry/[kind]/[id]";
import { palettes, spacing, radii, typeScale, shadows } from "@/theme/tokens";
const mockTheme = { colors:palettes.light, spacing,radii,type:typeScale,shadows };
const MockTextInput = TextInput;
const mockRouter = { back: jest.fn(), canGoBack: () => true, replace: jest.fn() };
let mockParams = { kind: "bottle", id: "b" };
const mockUpdateBottle = jest.fn(); const mockUpdateNursing = jest.fn(); const mockUpdatePump = jest.fn(); const mockTotal = jest.fn();
const mockState = {
 nursingSessions: [{ id:"n", side:"left", startedAt:"2026-10-20T10:00:25Z", endedAt:null }],
 bottleEvents: [{ id:"b", ml:90, occurredAt:"2026-10-20T10:00:25Z" }],
 pumpEvents: [{ id:"p", totalMl:80, startedAt:"2026-10-20T10:00:25Z" }],
 updateBottle:mockUpdateBottle, updateNursing:mockUpdateNursing, updatePump:mockUpdatePump, addPumpTotal:mockTotal,
};
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParams }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key:string) => key }) }));
jest.mock("@/theme/ThemeProvider", () => ({ useTheme: () => mockTheme }));
jest.mock("@/store/useLogStore", () => ({ useLogStore: (s:(state:typeof mockState)=>unknown) => s(mockState) }));
jest.mock("@/store/useSettingsStore", () => ({ useSettingsStore: (s:(state:object)=>unknown) => s({unit:"ml"}) }));
jest.mock("@/components/ScreenBack", () => ({ ScreenBack: () => null }));
jest.mock("@/components/DateTimeField", () => ({ DateTimeField: ({label,value,onChange}:{label:string;value:string;onChange:(s:string)=>void}) => <MockTextInput testID={label} value={value} onChangeText={onChange} /> }));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(async () => {}), ImpactFeedbackStyle: { Light:"light" } }));
beforeEach(() => { jest.clearAllMocks(); mockParams={kind:"bottle",id:"b"}; });
it("edits a bottle amount without rounding its recorded timestamp", () => {
 const screen=render(<EditEntry/>);
 fireEvent.changeText(screen.getByTestId("entry-edit-field-ml"),"125");
 fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateBottle).toHaveBeenCalledWith("b",{ml:125,occurredAt:"2026-10-20T10:00:25.000Z"});
});
it("edits a pump total", () => {
 mockParams={kind:"pump",id:"p"}; const screen=render(<EditEntry/>);
 fireEvent.changeText(screen.getByTestId("entry-edit-field-ml"),"110");
 fireEvent.press(screen.getByTestId("entry-edit-save")); expect(mockTotal).toHaveBeenCalledWith("p",110);
});
it("corrects a forgotten nursing stop to the actual end time", () => {
 mockParams={kind:"nursing",id:"n"}; const screen=render(<EditEntry/>);
 fireEvent.press(screen.getByText("timers.alreadyEnded"));
 fireEvent.changeText(screen.getByTestId("timers.start"),"2026-10-20 10:00");
 fireEvent.changeText(screen.getByTestId("timers.end"),"2026-10-20 10:20");
 fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateNursing).toHaveBeenCalledWith("n",expect.objectContaining({durationSeconds:1175,endedAt:expect.any(String)}));
});

it("allows a caregiver to edit nursing milk volume without ending the session", () => {
 mockParams={kind:"nursing",id:"n"}; const screen=render(<EditEntry/>);
 fireEvent.changeText(screen.getByTestId("entry-edit-field-ml"),"85");
 fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateNursing).toHaveBeenCalledWith("n",{side:"left",milkMl:85,startedAt:"2026-10-20T10:00:25.000Z"});
});
