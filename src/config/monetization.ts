/** Launch free. Enabling freemium is a future, explicit release decision, never a local preference. */
export type Plan = 'free' | 'premium';
export type PremiumFeature = 'advancedRecommendations' | 'stashForecast';
export function resolveMonetizationMode(value?: string): 'free' | 'freemium' { return value === 'freemium' ? 'freemium' : 'free'; }
export const MONETIZATION_MODE = resolveMonetizationMode(process.env.EXPO_PUBLIC_MONETIZATION_MODE);
export const BILLING_ENABLED = MONETIZATION_MODE === 'freemium';
export const PLAN_CATALOG = {
 free: { id: 'free', coreLogging: true },
 premium: { id: 'premium', coreLogging: true, features: ['advancedRecommendations', 'stashForecast'] as PremiumFeature[] },
} as const;
export function canUsePremiumFeature(_feature: PremiumFeature, hasPremium: boolean): boolean {
 return !BILLING_ENABLED || hasPremium;
}
