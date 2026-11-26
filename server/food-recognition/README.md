# Food recognition service

Deploy `index.js` and `handler.ts` as Supabase Edge Function `recognize-food`, with `verify_jwt: true`. Apply reviewed `quota.sql` with service-role access only. Enable anonymous Auth (configure signup abuse protection). The app creates an anonymous installation session only when the parent requests an analysis; it does not upload child profiles or journal data.

Server secrets: `OPENAI_API_KEY` and optional `OPENAI_FOOD_MODEL` (default `gpt-4.1-mini-2025-04-14`). The existing dashboard secret named `Nusring Queen` is accepted as a server-only fallback, so its value does not need to be retrieved or copied. Never use an EXPO_PUBLIC variable for the OpenAI key or service role key.

App build variables: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These are public connection values. Without them, the screen offers manual entry and states that recognition is not activated.

The handler accepts only inline JPEG/PNG/WebP, at most 4 MiB base64, never remote URLs. Each verified user has 20 requests/day, project-wide 100/day; quota reservation is atomic and failures count toward the limit. Quota counters are retained for up to 8 days and contain anonymous UUIDs. Supabase Auth manages its anonymous user/session records separately; quota cleanup does not delete those records. Define their lifecycle before a wider rollout. Images are sent to OpenAI with store:false, not persisted by our handler; OpenAI provider retention policies still apply. Review the app privacy disclosure before activation.

The model returns visible food suggestions, no quantity or medical guidance. Parents can edit/remove/add names. Continue opens the meal editor; only Save there records the meal. The Nursing Queen project and function are deployed; activation still requires anonymous Auth, client connection values and a successful real end-to-end check. Mocks do not validate recognition accuracy.

Activation check (26 November 2026): anonymous signup succeeds, unauthenticated POST is denied (401), and the provider receives the food-photo request. OpenAI currently responds 429 / credit_balance_exhausted. Real recognition remains unqualified until API credit is added and a controlled photo test succeeds. Build-time public connection values are configured in eas.json; no provider or service-role key is embedded in the app.
