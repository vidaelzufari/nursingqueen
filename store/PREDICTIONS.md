# Personal routine predictions

The current engine is a deterministic, on-device baseline, not a trained AI model or a clinical recommendation. It predicts the next recorded event; missed logs and forgotten timers can bias its inputs. Baby data stays on the device.

## Baseline v2
- Feed combines completed nursing and bottle timestamps. Pump uses entries with a positive saved amount. Sleep uses awake gaps between completed, non-overlapping sessions.
- Ignore future/invalid/duplicate timestamps and records older than seven days. Withhold predictions if the latest event is over a day old, fewer than two usable intervals exist, or the interquartile range is more than 65% of the median.
- Prefer intervals beginning within four hours of the latest event's local clock time when at least three are available. Otherwise use all recent intervals, capped at twenty.
- The median gives the countdown anchor; the 25th–75th percentiles describe a typical observed range, not a calibrated confidence interval. “Observed pattern” means at least five intervals, not proven accuracy.
- Running nursing/sleep suppresses that activity's next prediction. A session check-in never automatically ends or changes a record. Amount-only edits preserve timestamp seconds.

## Evaluation and next model
`evaluateForecast` performs up to thirty chronological holdouts using only data available before each target. It reports mean absolute error in minutes, observed-range hits, and how often a forecast could be made. These are retrospective log metrics, not medical validation. No accuracy number is claimed without actual evaluation data.

Before selecting an ML model: obtain consent for a representative, de-identified dataset; retain edit/missing-log indicators; evaluate feed, pump, and sleep separately; use baby-level train/test separation and chronological splits; compare against the median baseline using MAE, abstention rate and interval coverage; inspect daytime/nighttime and age cohorts. Only ship a model if it improves held-out performance and handles sparse/inconsistent histories honestly. Predictions must remain optional, editable and subordinate to caregiver cues and clinician instructions.

## Native integration
Optional local check-ins occur at 30 minutes of nursing and 2 hours of sleep. Those thresholds are reminders to check, not target durations. Enable in Settings. Stopping/deleting a session cancels its pending notification.

On iOS 16.2+, optional ActivityKit widgets display elapsed time using SwiftUI's system timer and deep-link back to the session controls. Dynamic Island depends on the iPhone model. The extension requires its own `nursingqueen.LiveActivity` signing profile and a native build. No remote push service is used. ActivityKit lifetime limits do not stop the stored session.

SDK 51 currently uses pinned `expo-live-activity@0.4.2` with the repository widget copied by postinstall. This legacy dependency should be replaced with Expo's supported widgets API during an SDK upgrade; validate start/stop/edit, relaunch, disabled permissions and notification delivery on a physical iPhone before a production release.
