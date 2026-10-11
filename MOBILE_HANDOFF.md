# LIFE: web and mobile candidate

Source: https://github.com/St0orm801/LIFE, starting commit 65505d2.

The web and mobile apps share `src/components/app-page.tsx` and the existing IndexedDB repository. The mobile build bundles its own assets and fonts; it does not load the production site in a remote WebView. Browser data and device data are separate. Existing JSON backup/restore is the intended transfer path, pending real-device validation.

## Changes

- Category filter shared between Timeline and Calendar.
- Overdue events separated from Today.
- ICS export uses valid day/week alarm durations, timestamps and categories.
- Past dates can be saved directly, with an inline Needs attention explanation.
- File selections belong to each form, preventing a cancelled form from attaching files to a later item.
- Android and iOS projects use Capacitor with app id `com.st0orm801.life` (confirm availability before store registration).
- Native notifications require user permission. Upcoming configured reminders plus the due date are scheduled at 09:00 local time, capped to the earliest 60. Refresh occurs when the app opens or items change. Removing all reminder rules disables scheduling for that item. There is no remote push or email service.
- Android Back returns to Today, then minimizes the app. Notification taps open the related item.

## Commands

Install: `npm install --legacy-peer-deps --ignore-scripts` (existing Cloudflare peer constraints).

Check: `npm run typecheck`, `bun test test/`.

Web build: `npm run build`. The build script now works on Windows and checks TypeScript before Vite.

Mobile: `npm run mobile:build`, `npx cap sync`.

Android: `android/gradlew.bat -p android assembleDebug`, with Android SDK and JDK 21 configured.

iOS: `npm run ios:open` on a Mac with Xcode, then select an Apple signing team and test on a physical iPhone. The iOS project uses Swift Package Manager.

## Release boundaries

The user authorized deployment after checks. `wrangler.life.jsonc` targets the existing `life` Worker and preserves the current runtime compatibility and bindings, verified from deployed version 716b4451-6f97-4ddc-a735-dfa097071e33. Its variables remain unchanged. The original platform placeholder config remains intact. GitHub `main` is connected to Cloudflare Builds; changes remain separate from `main` until reviewed.

APK builds are debug candidates, not signed Play Store releases. iOS binary, Apple signing, App Store submission, physical-device notification delivery, native file picker, backup/export and calendar import require device acceptance. Default Capacitor artwork must be replaced before store submission. No paid features or scanner have been added.

Published LIFE web: https://life.sevavtostrah.workers.dev/
Worker version: 31d50044-2b66-411a-ba45-376076ea7811. HTTP 200 and category-preserving Calendar verified after deployment. Final Android assembleDebug passed; APK: ../LIFE-mobile-001-debug.apk. No physical Android/iPhone validation or iOS binary. Changes remain local; GitHub main was not pushed.

## Free candidate 002
Build 2026.10.10-mobile-002 is completely free: no record cap, paywall, ads or RevenueCat SDK. Added React crash recovery screen, loading placeholders, notification rescheduling on native foreground return. Web deployed version 20b97499-31f1-4ee0-b3f7-2956d5d13c71; HTTP 200 and app screen verified. Typecheck/web/mobile builds and 40 tests passed. Android assembleDebug passed; ../LIFE-mobile-002-free-debug.apk. iOS signing, physical-device acceptance, store icons/privacy metadata and TestFlight upload remain undone.
Future paid features to evaluate: device sync and backup, shared household records, document OCR, home-screen widgets and batch import. Current records must remain accessible if a future subscription ends. Annual 9.99 CAD is a pricing hypothesis, not a configured store product.

## Purchase workflow candidate 003
Purchase records retain return and warranty deadlines, receipt attachments and store link. Decisions and returns appear on Today. Keep/start return/sent/confirm refund transitions write history; only user-confirmed refund closes the return. Calendar, ICS and native reminders include both pending deadlines. No eligibility, actual refund amount or automatic return claims.
Native More now checks notification permission, offers enabling and a 20-second test, and lets the user choose reminder time. iOS sound is configured. Android opens the system Clock alarm setup with visible confirmation; this is independent from event dates. Full iOS AlarmKit is not implemented. Physical notification/alarm validation is not run.
Cloud: .github/workflows/ios-cloud-check.yml compiles an unsigned simulator app on macOS. It does not upload to TestFlight. Store release needs a registered Bundle ID, distribution signing, physical device acceptance and completed Apple metadata. Unity Build Automation targets Unity projects and is not the build pipeline for this React/Capacitor project.

## iPhone beta preparation 004
Apple app ID 6821531868; Bundle ID com.st0orm801.life. App Store metadata, contacts, support/marketing URLs and manual release saved; categories Productivity/Shopping. Privacy policy URL and Data Not Collected declaration saved as draft. Age rating questionnaire calculated 4+. Internal TestFlight group LIFE Owner Test created with manual build distribution. No testers or builds assigned yet.
Receipt-safe JSON backup v2 added; invalid imports preserve records, repository restore is transactional. iOS branded opaque 1024px icon generated from the existing SVG. Non-exempt encryption flag false (OS transport only). 47 tests pass.
Signed workflow is gated by LIFE_SIGNING_READY and protected environment life-testflight. Required secrets: LIFE_P12_BASE64, LIFE_P12_PASSWORD, LIFE_PROFILE_BASE64, LIFE_ASC_KEY_BASE64, LIFE_ASC_KEY_ID, LIFE_ASC_ISSUER_ID. It exports internal TestFlight-only and never submits App Review. Bash syntax and YAML checked; signed archive/upload NOT RUN. Private key and verified CSR are outside this repository in ../life-signing-private. Apple Developer certificate form failed to load in IAB, so no certificate/profile issued. Screenshots/content rights/free price and final privacy publication are still pending. Do not claim all Apple metadata is complete.
