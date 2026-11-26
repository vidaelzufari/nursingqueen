import { BILLING_ENABLED } from "@/config/monetization";
import { create } from "zustand";
import { CustomerInfo } from "react-native-purchases";
import {
  configureRevenueCat,
  fetchCustomerInfo,
  isQueenUnlocked,
  purchaseQueenUnlock,
  restorePurchases,
} from "@/services/revenuecat";

interface EntitlementState {
  isUnlocked: boolean;
  isLoading: boolean;
  init: () => Promise<void>;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useEntitlementStore = create<EntitlementState>()((set) => ({
  isUnlocked: !BILLING_ENABLED,
  isLoading: BILLING_ENABLED,

  init: async () => {
    if (!BILLING_ENABLED) { set({ isUnlocked: true, isLoading: false }); return; }
    configureRevenueCat();
    try {
      const info = await fetchCustomerInfo();
      set({ isUnlocked: isQueenUnlocked(info), isLoading: false });
    } catch {
      // Offline or not configured yet — logger/history/profile stay usable regardless.
      set({ isLoading: false });
    }
  },

  purchase: async () => {
    if (!BILLING_ENABLED) { set({ isUnlocked: true }); return; }
    const info: CustomerInfo = await purchaseQueenUnlock();
    set({ isUnlocked: isQueenUnlocked(info) });
  },

  restore: async () => {
    if (!BILLING_ENABLED) { set({ isUnlocked: true }); return; }
    const info = await restorePurchases();
    set({ isUnlocked: isQueenUnlocked(info) });
  },
}));
