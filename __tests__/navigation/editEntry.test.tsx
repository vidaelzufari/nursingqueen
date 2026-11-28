import React from "react";
import { TextInput } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import EditEntry from "../../app/entry/[kind]/[id]";
import { palettes, spacing, radii, typeScale, shadows } from "@/theme/tokens";
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }) }));
const mockTheme = { colors:palettes.light, spacing,radii,type:typeScale,shadows };
const MockTextInput = TextInput;
const mockRouter = { back: jest.fn(), canGoBack: () => true, replace: jest.fn() };
let mockUnit = "ml";
let mockParams = { kind: "bottle", id: "b" };
const mockUpdateBottle = jest.fn(); const mockUpdateNursing = jest.fn(); const mockUpdatePump = jest.fn(); const mockTotal = jest.fn();
const mockDeleteBottle = jest.fn(); const mockDeletePump = jest.fn();
const mockState = {
 deleteBottle:mockDeleteBottle, deletePump:mockDeletePump, deleteNursing:jest.fn(),
 nursingSessions: [{ id:"n", side:"left", startedAt:"2026-10-20T10:00:25Z", endedAt:null as string | null, milkMl:90 }],
 bottleEvents: [{ id:"b", ml:90, milkType:"breast_milk", occurredAt:"2026-10-20T10:00:25Z" }],
 pumpEvents: [{ id:"p", totalMl:80, startedAt:"2026-10-20T10:00:25Z" }],
 updateBottle:mockUpdateBottle, updateNursing:mockUpdateNursing, updatePump:mockUpdatePump, addPumpTotal:mockTotal,
};
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParams }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key:string) => key }) }));
jest.mock("@/theme/ThemeProvider", () => ({ useTheme: () => mockTheme }));
jest.mock("@/store/useLogStore", () => ({ useLogStore: (s:(state:typeof mockState)=>unknown) => s(mockState) }));
jest.mock("@/store/useSettingsStore", () => ({ useSettingsStore: (s:(state:object)=>unknown) => s({unit:mockUnit}) }));
jest.mock("@/components/ScreenBack", () => ({ ScreenBack: () => null }));
jest.mock("@/components/DateTimeField", () => ({ DateTimeField: ({label,value,onChange}:{label:string;value:string;onChange:(s:string)=>void}) => <MockTextInput testID={label} value={value} onChangeText={onChange} /> }));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(async () => {}), ImpactFeedbackStyle: { Light:"light" } }));
beforeEach(() => { jest.clearAllMocks(); mockUnit="ml"; mockParams={kind:"bottle",id:"b"}; });
it("edits a bottle amount without rounding its recorded timestamp", () => {
 const screen=render(<EditEntry/>);
 fireEvent.changeText(screen.getByTestId("entry-edit-field-ml"),"125");
 fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateBottle).toHaveBeenCalledWith("b",{ml:125,milkType:"breast_milk",occurredAt:"2026-10-20T10:00:25.000Z"});
});
it("edits a pump total", () => {
 mockParams={kind:"pump",id:"p"}; const screen=render(<EditEntry/>);
 fireEvent.changeText(screen.getByTestId("entry-edit-field-ml"),"110");
 fireEvent.press(screen.getByTestId("entry-edit-save")); expect(mockUpdatePump).toHaveBeenCalledWith("p",{startedAt:"2026-10-20T10:00:25.000Z",totalMl:110}); expect(mockTotal).not.toHaveBeenCalled();
});
it("corrects a forgotten nursing stop to the actual end time", () => {
 mockParams={kind:"nursing",id:"n"}; const screen=render(<EditEntry/>);
 fireEvent.changeText(screen.getByTestId("timers.start"),"2026-10-20 10:00");
 fireEvent.changeText(screen.getByTestId("timers.end"),"2026-10-20 10:20");
 fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateNursing).toHaveBeenCalledWith("n",expect.objectContaining({durationSeconds:1175,endedAt:expect.any(String)}));
});

it("allows a caregiver to edit nursing milk volume without ending the session", () => {
 mockParams={kind:"nursing",id:"n"}; const screen=render(<EditEntry/>);
 fireEvent.press(screen.getByText("timers.keepRunning"));
 fireEvent.changeText(screen.getByTestId("entry-edit-field-ml"),"85");
 fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateNursing).toHaveBeenCalledWith("n",{side:"left",milkMl:85,startedAt:"2026-10-20T10:00:25.000Z"});
});

it("preserves the stored nursing amount when only viewing its rounded ounce display", () => {
 mockUnit="oz"; mockParams={kind:"nursing",id:"n"}; const screen=render(<EditEntry/>);
 fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateNursing).toHaveBeenCalledWith("n",expect.objectContaining({milkMl:90}));
});

it("finishes an active feed on save using the time of saving, without another Stop", () => {
 jest.useFakeTimers();
 try {
  jest.setSystemTime(new Date("2026-10-20T10:00:30Z"));
  mockParams={kind:"nursing",id:"n"}; const screen=render(<EditEntry/>);
  expect(screen.getByText("timers.finishAndSave")).toBeTruthy();
  jest.setSystemTime(new Date("2026-10-20T10:02:17Z"));
  fireEvent.press(screen.getByTestId("entry-edit-save"));
  expect(mockUpdateNursing).toHaveBeenCalledWith("n",expect.objectContaining({
   startedAt:"2026-10-20T10:00:25.000Z",endedAt:"2026-10-20T10:02:17.000Z",durationSeconds:112,
  }));
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
 } finally { jest.useRealTimers(); }
});

it("rejects a corrected end time before the feed started", () => {
 mockParams={kind:"nursing",id:"n"}; const screen=render(<EditEntry/>);
 fireEvent.changeText(screen.getByTestId("timers.end"),"2026-10-20 09:59");
 fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateNursing).not.toHaveBeenCalled();
});

it("preserves a completed feed’s original end time when editing its amount", () => {
 const session=mockState.nursingSessions[0]!;
 session.endedAt="2026-10-20T10:15:43Z";
 try {
  mockParams={kind:"nursing",id:"n"}; const screen=render(<EditEntry/>);
  expect(screen.queryByText("timers.finishAndSave")).toBeNull();
  fireEvent.changeText(screen.getByTestId("entry-edit-field-ml"),"100");
  fireEvent.press(screen.getByTestId("entry-edit-save"));
  expect(mockUpdateNursing).toHaveBeenCalledWith("n",expect.objectContaining({
   milkMl:100,endedAt:"2026-10-20T10:15:43.000Z",durationSeconds:918,
  }));
 } finally { session.endedAt=null; }
});

for (const kind of ["bottle", "pump"]) {
 it(`confirms ${kind} deletion and lets the parent cancel`, () => {
  mockParams={kind,id:kind==="bottle"?"b":"p"}; const screen=render(<EditEntry/>);
  fireEvent.press(screen.getByTestId("entry-delete-open"));
  expect(mockDeleteBottle).not.toHaveBeenCalled(); expect(mockDeletePump).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId("entry-delete-cancel"));
  expect(mockRouter.back).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId("entry-delete-open"));
  fireEvent.press(screen.getByTestId("entry-delete-confirm"));
  expect(kind==="bottle"?mockDeleteBottle:mockDeletePump).toHaveBeenCalledWith(kind==="bottle"?"b":"p");
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
 });
}
it("keeps the editor open on deletion failure and permits retry", () => {
 const screen=render(<EditEntry/>); mockDeleteBottle.mockImplementationOnce(()=>{throw new Error("storage unavailable");});
 fireEvent.press(screen.getByTestId("entry-delete-open")); fireEvent.press(screen.getByTestId("entry-delete-confirm"));
 expect(mockRouter.back).not.toHaveBeenCalled(); expect(screen.getAllByText("entryQA.saveError").length).toBeGreaterThan(0);
 fireEvent.press(screen.getByTestId("entry-delete-confirm")); expect(mockRouter.back).toHaveBeenCalledTimes(1);
});
it("keeps an unchanged bottle volume exact in ounces", () => {
 mockUnit="oz"; const screen=render(<EditEntry/>); fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockUpdateBottle).toHaveBeenCalledWith("b",expect.objectContaining({ml:90}));
});
it("does not close on a failed edit and retries once", () => {
 mockUpdateBottle.mockImplementationOnce(()=>{throw new Error("disk");}); const screen=render(<EditEntry/>);
 fireEvent.changeText(screen.getByTestId("entry-edit-field-ml"),"130"); fireEvent.press(screen.getByTestId("entry-edit-save"));
 expect(mockRouter.back).not.toHaveBeenCalled(); expect(screen.getByTestId("entry-edit-field-ml").props.value).toBe("130");
 fireEvent.press(screen.getByTestId("entry-edit-save")); expect(mockRouter.back).toHaveBeenCalledTimes(1);
});
it("does not offer save for an entry that no longer exists", () => {
 mockParams={kind:"bottle",id:"missing"}; const screen=render(<EditEntry/>);
 expect(screen.getByText("entryQA.notFound")).toBeTruthy(); expect(screen.queryByTestId("entry-edit-save")).toBeNull();
});

it("refreshes the total after returning from the nested left/right editor", () => {
 mockParams={kind:"pump",id:"p"}; const pump=mockState.pumpEvents[0]!; const old=pump.totalMl;
 try {
  const screen=render(<EditEntry/>); pump.totalMl=125; screen.rerender(<EditEntry/>);
  expect(screen.getByTestId("entry-edit-field-ml").props.value).toBe("125");
  fireEvent.press(screen.getByTestId("entry-edit-save"));
  expect(mockUpdatePump).toHaveBeenCalledWith("p",{startedAt:"2026-10-20T10:00:25.000Z"});
 } finally {pump.totalMl=old;}
});
