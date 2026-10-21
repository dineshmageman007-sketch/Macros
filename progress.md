# MacroTracker - progress log (READ THIS FIRST when resuming)
Last updated: 2026-10-21 (milestone 2)

## CURRENT STATE
- Project was rebuilt from the user's `Macros.apk` (package `com.macrotracker.app`): the app is one offline HTML page in a WebView.
  The original source was not available, so MainActivity.java was reconstructed from the APK's code and the page was kept as-is, then refined.
- Verified in sandbox: `node tools/test_logic.js` = 16/16 pass (escaping, import validation, macros math, streak).
- NOT verified: Gradle build, Java compile, running on a real phone (no Android SDK / javac / network in the sandbox).
  The new backup-export path (AndroidBridge.saveFile -> system "save as" dialog) is untested on a device.
- Unknown from the APK, so assumed: targetSdk 34, versionName 1.1 (code 2), manifest configChanges/softInputMode, strings ("Macro Tracker").

## DECISIONS
- Keep it a single offline HTML page in a WebView; no web server, no accounts, no network.
- Bundled page URL stays `file:///android_asset/index.html` (saved data is tied to this origin; changing it would hide existing user data).
- Internal ids never renamed: package `com.macrotracker.app`, localStorage keys `mt_*2`, backup format `{app:'macro-tracker',version:1,...}`.
- APK is signed with a fixed personal key `app/macrotracker.keystore` (password in app/build.gradle) so CI builds update in place.
  Sideload only; do not use for Play Store. It differs from the old APK's key (see README for the one-time uninstall/import).

## RULES / DO NOT BREAK
- All user text goes through `esc()` before innerHTML; ids in inline onclick must match SAFE_ID; group names in onclick use `jsEsc()`. Reason: names/notes were injected raw, and imported backups are untrusted.
- Imports go through `sanitizeBackup()` (ids, numbers, colors, dates validated). Backup file format must stay backward compatible.
- Export must keep the browser fallback (anchor download) and prefer `window.AndroidBridge.saveFile` (blob downloads do nothing in WebView).
- `save()` warns once if storage fails (silent data loss otherwise).
- WebView must not navigate away from `file:///android_asset/`.

## DESIGN RULES
- User: one person tracking daily food; problem removed: counting macros by hand each day.
- Main screen (Today): streak, macro rings, tick-off list. Rare options (targets, backup, database edits) stay one tap away.
- Errors: bad import file -> clear message, nothing changes; storage failure -> one warning; empty states show hints.
- Safety: backup files are untrusted input (validated); no network permission requested; no external navigation.
- Same words everywhere: Foods, Groups, Targets, Backup, Today/Database/History.

## MAP
- `app/src/main/assets/index.html` - the whole app (UI + logic + storage)
- `app/src/main/java/.../MainActivity.java` - WebView host, file picker (import), save dialog (export), navigation lock
- `app/src/main/res`, `AndroidManifest.xml` - icon, name, dark theme
- `app/build.gradle`, `build.gradle`, `settings.gradle` - Gradle (AGP 8.5.2, compile/target 34, min 23)
- `.github/workflows/build.yml` - tests then release APK; artifact `MacroTracker-apk`; `v*` tag makes a Release
- `tools/test_logic.js` - headless tests

## TESTS
- `node tools/test_logic.js` (stubs the DOM, loads the page script). Gotcha: top-level `let` vars are reached via `vm.runInContext`.

## WORKFLOW + PREFS
- User is on Windows, pushes to GitHub, downloads the build from Actions. Wants one progress.zip + progress.md, short replies, full files.

## REMAINING WORK
1. Push, let CI build, install on a phone, and test: export backup (save dialog), import backup, rotate screen, back key.
2. Re-run CI after M2 fix. If it fails on Gradle/AGP versions, fix build files first (most likely place for a problem).
3. Optional, only if asked: cleanup of dead code (`isPersistent` is always true), split index.html into js/css files.

---
# HISTORY
- M2 (2026-10-21): first CI run: tests passed, APK job failed at android-actions/setup-android ("Failed to find package 'tools'"). Removed that step (SDK is preinstalled on ubuntu-latest), kept a license-accept step. Gradle build still unverified.
- M1 (2026-10-21): rebuilt project from APK; added HTML escaping, backup validation, Android export bridge, navigation lock, safer WebView file settings, CI, tests.
