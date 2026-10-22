import { create } from "zustand";
interface Feedback { id: number; message: string; undo?: () => void }
let sequence = 0;
export const useFeedbackStore = create<{ feedback: Feedback | null; show: (message: string, undo?: () => void) => void; dismiss: (id: number) => void }>()(set => ({
  feedback: null,
  show: (message, undo) => set({ feedback: { id: ++sequence, message, undo } }),
  dismiss: id => set(state => state.feedback?.id === id ? { feedback: null } : {}),
}));
