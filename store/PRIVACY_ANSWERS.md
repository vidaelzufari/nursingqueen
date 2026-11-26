# The Nursing Queen — store submission reference

Updated 26 November 2026. Target submission: Monday 30 November 2026.
This replaces the obsolete statement that the app has no online service.

## Public URLs

- Marketing: https://blumea.ae/nursing-queen
- Privacy: https://blumea.ae/nursing-queen/privacy
- Support: https://blumea.ae/nursing-queen/support
- Terms: https://blumea.ae/nursing-queen/terms
- Data deletion: https://blumea.ae/nursing-queen/delete-data

## Release configuration

All currently available app functionality is free at launch. All EAS profiles use
`EXPO_PUBLIC_MONETIZATION_MODE=free`. No purchase, subscription or advertising SDK
is required to use the launch version. RevenueCat is not initialised in free mode;
purchase and restore actions are no-ops that preserve free access.

Future freemium mode is an explicit release configuration, not a user preference.
`src/config/monetization.ts` defines free and premium plans. Product prices and
subscription terms must come from the actual store offering before enabling billing.
Do not submit the dormant Queen Unlock product as a requirement for this free release.

`EXPO_PUBLIC_FOOD_AI_ENABLED=false` keeps photo analysis unavailable. The app does
not authenticate a guest or transmit a food photo in this configuration. Its server
is deployed, but a successful live recognition still requires provider credit and
qualification before the flag is changed. Manual meal logging remains available.

## Data flows to declare for the actual binary

Baby name, birth date, profile image, weight, nursing, pumping, bottle, sleep,
solid-food meals, notes, food plans and preferences are stored locally. The journal
is not synchronised to a first-party cloud account. Local processing is not itself
collection off-device under store questionnaires. Device backups and paired Apple
surfaces are governed separately by OS settings and permissions.

### Free launch with AI disabled

- No app advertising or behavioural analytics SDK. No advertising ID and no ATT request.
- No RevenueCat identifier or purchase calls in free mode.
- No image upload or Supabase guest signup by the disabled photo feature.
- Sentry crash reporting remains conditional on `EXPO_PUBLIC_SENTRY_DSN`. Inspect
  the exact EAS environment/build before marking Diagnostics as collected or not.
  Configured Sentry uses crash/error reporting, no performance tracing or session replay.
  Structured name, note, birth-date and photo-reference fields are scrubbed; event.user
  is removed. Scrubbing is a mitigation, not a guarantee that arbitrary free text is safe.
- Support form requests are a separate, optional off-app website flow. They transmit
  the parent's submitted contact details/message to Blumea through hosting and Resend.
  The Nursing Queen website routes exclude the site's Google Analytics component.

### Before enabling photo recognition in a later release

- Update Apple App Privacy and Google Data Safety for selected food photos and
  pseudonymous technical authentication/usage records, based on then-current policies.
- Photo plus interface language go via Supabase to OpenAI after the parent taps Analyze.
  Baby profile and journal fields are excluded. Images may nevertheless contain personal data.
- `store:false` is used for OpenAI Responses. It is not Zero Data Retention; provider
  abuse-monitoring retention and safety/legal exceptions still apply.
- The handler does not persist/log images or suggestion contents. Daily quota counters
  expire through cleanup after eight days. Auth guest records/session data have a
  separate lifecycle. Do not describe them as deleted by quota cleanup.
- The user reviews and can edit/remove suggestions before local save. No hidden ingredients,
  allergens, safety, quantities or nutrition are inferred by the intended service.

## Store configuration still requiring console verification

Set the app's price to free. Use the URLs above. Declare the app's actual age rating,
permissions and health-related functionality accurately; the app is operated by adults
and contains child records, but is not a child-facing game or diagnostic medical device.
Do not promise clinical validation or health outcomes.

Check the exact production environment for diagnostic SDK activation. Reconcile the
final Apple and Google questionnaires with the signed binary, including any configured
provider collection. Do not copy an old blanket 'no data collected' answer.

Google Play publication still requires its own package, signing, tester and Play Console
requirements. A successful iOS TestFlight submission is not an App Store review
submission or a Google Play submission. Store console access and final build status
must be verified before marking Monday's submission complete.

## QA status

Automated and browser tests support the implementation, but do not certify all native
iPhone, Watch, widget, notification or migration scenarios. Continue physical-device QA;
record open blockers before the review submission. Do not mark the acceptance report
as fully passed solely because the app is submitted for review.
