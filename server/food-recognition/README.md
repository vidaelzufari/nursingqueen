# Food recognition service

Deploy `index.js` and `handler.ts` as Supabase Edge Function `recognize-food`, with `verify_jwt: true`. Apply reviewed `quota.sql` with service-role access only. Enable anonymous Auth (configure signup abuse protection). The app creates an anonymous installation session only when the parent requests an analysis; it does not upload child profiles or journal data.

Server secrets: `OPENAI_API_KEY` and optional `OPENAI_FOOD_MODEL` (default `gpt-4.1-mini-2025-04-14`). Never use an EXPO_PUBLIC variable for the OpenAI key or service role key.

App build variables: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These are public connection values. Without them, the screen offers manual entry and states that recognition is not activated.

The handler accepts only inline JPEG/PNG/WebP, at most 4 MiB base64, never remote URLs. Each verified user has 20 requests/day, project-wide 100/day; quota reservation is atomic and failures count toward the limit. Only counters and anonymous UUIDs are persisted server-side for up to 8 days. Images are sent to OpenAI with store:false, not persisted by our handler; OpenAI provider retention policies still apply. Review the app privacy disclosure before activation.

The model returns visible food suggestions, no quantity or medical guidance. Parents can edit/remove/add names. Continue opens the meal editor; only Save there records the meal. The service is pending a real project, server secret and end-to-end qualification. Mocks do not validate recognition accuracy.
