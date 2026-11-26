import {useEntitlementStore} from '@/store/useEntitlementStore';
let mockBilling=false;
const mockConfigure=jest.fn(),mockFetch=jest.fn(),mockPurchase=jest.fn(),mockRestore=jest.fn();
jest.mock('@/config/monetization',()=>({get BILLING_ENABLED(){return mockBilling;}}));
jest.mock('@/services/revenuecat',()=>({configureRevenueCat:()=>mockConfigure(),fetchCustomerInfo:()=>mockFetch(),purchaseQueenUnlock:()=>mockPurchase(),restorePurchases:()=>mockRestore(),isQueenUnlocked:(info:{premium:boolean})=>info.premium}));
beforeEach(()=>{jest.clearAllMocks();mockBilling=false;useEntitlementStore.setState({isUnlocked:true,isLoading:false});});
it('launches fully unlocked and never contacts billing, even through stale purchase and restore routes',async()=>{
 await useEntitlementStore.getState().init();await useEntitlementStore.getState().purchase();await useEntitlementStore.getState().restore();
 expect(useEntitlementStore.getState()).toMatchObject({isUnlocked:true,isLoading:false});
 expect(mockConfigure).not.toHaveBeenCalled();expect(mockFetch).not.toHaveBeenCalled();expect(mockPurchase).not.toHaveBeenCalled();expect(mockRestore).not.toHaveBeenCalled();
});
it('retains a future premium entitlement when freemium is explicitly enabled',async()=>{
 mockBilling=true;mockFetch.mockResolvedValue({premium:true});await useEntitlementStore.getState().init();expect(useEntitlementStore.getState().isUnlocked).toBe(true);expect(mockConfigure).toHaveBeenCalledTimes(1);
 mockFetch.mockResolvedValue({premium:false});await useEntitlementStore.getState().init();expect(useEntitlementStore.getState().isUnlocked).toBe(false);
});
it('defaults unknown or missing release modes to free',()=>{
 const {resolveMonetizationMode,PLAN_CATALOG}=jest.requireActual('@/config/monetization');expect(resolveMonetizationMode()).toBe('free');expect(resolveMonetizationMode('typo')).toBe('free');expect(resolveMonetizationMode('freemium')).toBe('freemium');expect(PLAN_CATALOG.free.coreLogging).toBe(true);
});
