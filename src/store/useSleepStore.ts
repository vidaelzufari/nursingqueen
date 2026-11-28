import i18n from "@/i18n";
import { useFeedbackStore } from "./useFeedbackStore";
import { create } from "zustand";
import { SleepSession, SleepPeriod } from "@/db/types";
import { sleepRepository } from "@/db/repositories/sleepRepository";
interface SleepState {
  babyId: string | null;
  sessions: SleepSession[];
  refresh: (babyId: string) => void;
  start: (period?: SleepPeriod) => void;
  setPeriod: (id: string, period: SleepPeriod) => void;
  stop: (id: string) => void;
  adjustStart: (id: string, seconds: number) => void;
  updateRunning: (id: string, start: Date, period: SleepPeriod) => void;
  save: (start: Date, end: Date, id?: string, period?: SleepPeriod) => void;
  remove: (id: string) => void;
}
export const useSleepStore = create<SleepState>()((set, get) => ({
  babyId: null, sessions: [],
  refresh: babyId => set({ babyId, sessions: sleepRepository.list(babyId) }),
  start: (period) => { const id = get().babyId; if (id) { sleepRepository.start(id, period); useFeedbackStore.getState().show(i18n.t("feedback.sleepStarted")); get().refresh(id); } },
  setPeriod: (id, period) => { sleepRepository.setPeriod(id, period); const baby = get().babyId; if (baby) get().refresh(baby); },
  stop: id => { sleepRepository.stop(id); useFeedbackStore.getState().show(i18n.t("feedback.sleepSaved")); const baby = get().babyId; if (baby) get().refresh(baby); },
  adjustStart: (id, seconds) => { sleepRepository.adjustStart(id, seconds); const baby = get().babyId; if (baby) get().refresh(baby); useFeedbackStore.getState().show(i18n.t("sleep.timeUpdated")); },
  updateRunning: (id, start, period) => { const baby = get().babyId; if (!baby) throw new Error("No active baby"); sleepRepository.updateRunning(baby, id, start, period); get().refresh(baby); useFeedbackStore.getState().show(i18n.t("sleep.timeUpdated")); },
  save: (start, end, id, period) => { const baby = get().babyId; if (baby) { sleepRepository.save(baby, start, end, id, period); useFeedbackStore.getState().show(i18n.t("feedback.sleepSaved")); get().refresh(baby); } },
  remove: id => { sleepRepository.delete(id); const baby = get().babyId; if (baby) get().refresh(baby); },
}));
