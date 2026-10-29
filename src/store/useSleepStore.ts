import i18n from "@/i18n";
import { useFeedbackStore } from "./useFeedbackStore";
import { create } from "zustand";
import { SleepSession } from "@/db/types";
import { sleepRepository } from "@/db/repositories/sleepRepository";
interface SleepState {
  babyId: string | null;
  sessions: SleepSession[];
  refresh: (babyId: string) => void;
  start: () => void;
  stop: (id: string) => void;
  adjustStart: (id: string, seconds: number) => void;
  save: (start: Date, end: Date, id?: string) => void;
  remove: (id: string) => void;
}
export const useSleepStore = create<SleepState>()((set, get) => ({
  babyId: null, sessions: [],
  refresh: babyId => set({ babyId, sessions: sleepRepository.list(babyId) }),
  start: () => { const id = get().babyId; if (id) { sleepRepository.start(id); useFeedbackStore.getState().show(i18n.t("feedback.sleepStarted")); get().refresh(id); } },
  stop: id => { sleepRepository.stop(id); useFeedbackStore.getState().show(i18n.t("feedback.sleepSaved")); const baby = get().babyId; if (baby) get().refresh(baby); },
  adjustStart: (id, seconds) => { sleepRepository.adjustStart(id, seconds); const baby = get().babyId; if (baby) get().refresh(baby); useFeedbackStore.getState().show(i18n.t("sleep.timeUpdated")); },
  save: (start, end, id) => { const baby = get().babyId; if (baby) { sleepRepository.save(baby, start, end, id); useFeedbackStore.getState().show(i18n.t("feedback.sleepSaved")); get().refresh(baby); } },
  remove: id => { sleepRepository.delete(id); const baby = get().babyId; if (baby) get().refresh(baby); },
}));
