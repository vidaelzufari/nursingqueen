# Nursing Queen CI/CD

Repository: https://github.com/vidaelzufari/nursingqueen
Expo account supplied by owner: `vida.elzufari`.
Configured EAS project ID: `ce5adcd3-f209-4df0-9709-02ab9fce3323`.
Project ownership and the GitHub link were verified in the Expo dashboard.

## Automated pipeline

| Trigger | Result |
| --- | --- |
| Branch push or pull request | TypeScript, ESLint, Jest coverage, iOS and Android bundle export |
| Successful push to main or release/* | Wait for preview iOS and Android builds; build failures fail the workflow |
| v* tag | Repeat checks, validate matching tag/app/package version, build production binaries, enqueue TestFlight and Play internal submissions |
| Run “Publish OTA update” on main | Check source then publish to selected preview/production channel using the corresponding EAS environment |
| Run “Submit tested Android build to production draft” on main | Submit the exact supplied build ID to Play production as a draft |

GitHub Actions is the single trigger system. The old EAS workflow templates
were removed to prevent duplicate releases. The Expo GitHub App is optional;
GitHub Actions authenticates to Expo with EXPO_TOKEN. Do not enable another
Expo auto-build trigger for the same branches/tags.

Pinned Node version: .nvmrc. Pinned EAS CLI: 25.3.0 (also enforced in eas.json).
Release jobs are serialized per ref and never cancelled by a newer push.
PR CI has read-only repository permissions and receives no Expo token.
Build matrix jobs run independently so one platform failure does not cancel
the other platform. A green build step means EAS Build finished successfully;
auto-submission is queued by EAS and must be checked in the Expo submission
page for its final status. It does not mean an app is public.

## One-time account setup

1. Sign in to Expo as the project owner and confirm the configured project ID
   belongs to Nursing Queen. Use `npx eas-cli@25.3.0 login` locally, then
   `npx eas-cli@25.3.0 project:info`. Do not initialize a duplicate project.
2. Create an Expo automation access token and save it in this repository's
   Settings → Secrets and variables → Actions as secret `EXPO_TOKEN`.
   Never put the token in source control, a workflow input, or chat.
3. In App Store Connect create/select the app `com.nursingqueen.app`. Set
   repository Actions **variable** `ASC_APP_ID` to its numeric Apple ID.
   The release preparation script validates and injects this value into
   eas.json during the release job. The bare ios submit profile is incomplete
   until that script runs; no fake Apple account values are committed.
4. Run `npx eas-cli@25.3.0 credentials --platform ios` and configure distribution
   signing plus an App Store Connect API key for EAS Submit. Register preview
   test devices with `npx eas-cli@25.3.0 device:create`. Ad-hoc iOS preview builds
   require a paid Apple Developer account and registered devices.
5. Run `npx eas-cli@25.3.0 credentials --platform android` to configure the
   keystore and assign a Google Play service account key to this app on EAS.
   Submission profiles intentionally omit a local key path so EAS uses the
   assigned server credential. Google Play requires the first upload manually.
6. Finish one interactive preview build and a production build/submission per
   platform to provision signing, accept account agreements, and verify access.
7. In GitHub create environments `preview` and `production`. Add required
   reviewers for production if desired. Configure main branch protection to
   require the CI check before merging. These account settings are not installed
   merely by committing the workflow files.

Missing EXPO_TOKEN fails builds with a setup message. Missing/invalid ASC_APP_ID
fails release preparation before a build is charged. Credentials and account
agreements cannot be created by a non-interactive release job.

## Expo environment configuration

Build profiles explicitly select development, preview, or production. OTA jobs
use `--environment` with the same name to load the same Expo variables.
Configure the following on Expo for each relevant environment:

- EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
- EXPO_PUBLIC_SENTRY_DSN
- SENTRY_ORG / SENTRY_PROJECT and build-only SENTRY_AUTH_TOKEN if using Sentry

EXPO_PUBLIC_* values are embedded in the shipped app; use only public SDK keys.
Private keys and Sentry upload credentials must never use this prefix.
EAS_PROJECT_ID and EAS_UPDATE_URL have matching defaults in app.config.ts;
override them only when deliberately moving this app to another EAS project.
Fingerprint runtime versions separate OTA updates when native dependencies
change. Existing builds using the former appVersion runtime require a new
binary before they can receive fingerprint-based updates.

## Release

Update version in both package.json (and package-lock.json) and app.config.ts.
Merge to main, wait for CI and preview builds, then tag that tested commit:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The tag must exactly match both versions. A prerelease tag requires matching
prerelease app/package versions too. Watch the GitHub Actions build result and
Expo submissions; verify both store uploads and test on actual devices.
Do not push release tags on unreviewed commits.

For iOS public release, select the already uploaded TestFlight build in App
Store Connect and submit it for review. Re-uploading the same build is not a
promotion. For Android, use Play Console's promote-release operation, or run
the production draft workflow with the exact tested EAS build UUID, then
review/publish the draft in Play Console. Store metadata, privacy answers,
agreements, policy reviews, and platform account requirements remain applicable.

## OTA and recovery

Use Actions → Publish OTA update → Run workflow on main. Choose preview first,
verify on an installed compatible preview binary, then select production when
ready. Native dependency changes require a fresh binary for the new runtime.
Use the Expo Updates dashboard to roll back a faulty update; submit a new binary
for a faulty native release. A failed build must be fixed before submitting;
for a failed store upload inspect Expo submission logs before retrying to avoid
duplicate uploads. Release signing/billing/account failures need account-owner
attention.

## References

- https://docs.expo.dev/build/building-on-ci/
- https://docs.expo.dev/submit/ios/
- https://docs.expo.dev/submit/android/
- https://docs.expo.dev/eas-update/runtime-versions/
- https://docs.expo.dev/eas/environment-variables/usage/

## Existing iOS build failure

The previous build 8f7513f3 failed in ExpoLocalization with “switch must be
exhaustive” on iPhoneOS26.5. The postinstall script adds an idempotent unknown
calendar fallback to the SDK 51 native module (Expo issue 40009). This patch
fails visibly if the dependency source changes and is covered by regression
tests. Build profiles retain the current Xcode image for store compatibility.
A fresh EAS build is still required to verify native compilation end to end;
JavaScript bundle export alone does not verify Swift compilation.

## Native build compatibility and TestFlight

Builds pin Xcode 26.2 and use expo-build-properties to target iOS 15.1.
expo-device is explicitly pinned to the SDK 51 range so sentry-expo's broad
peer requirement cannot pull an incompatible SDK 57 native module.
Use the “Build and submit to TestFlight” workflow on main for an iOS-only
production build and automatic submission after ASC_APP_ID and EAS-managed
Apple signing/submission credentials are configured. This does not publish
the app publicly. Check Expo submission status and Apple processing afterward.

The SDK 51 postinstall compatibility script also replaces expo-device's
obsolete TARGET_OS_SIMULATOR macro with Swift targetEnvironment(simulator).
For Android, the EAS post-install hook prefetches the exact SQLite archive
over IPv4 with retries and SHA-256 verification before Gradle executes; Java
networking also prefers IPv4. The hook refuses a changed SQLite source version
or mismatching archive. These address failures observed in actual EAS runs.
