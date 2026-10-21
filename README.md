# Macro Tracker

Offline calorie/macro tracker for Android (kcal, carbs, protein, fat, fibre). Daily food list, food database with groups,
daily targets, streak, 7-day chart, history, and file backup/restore. No account, no internet, data stays on the phone.

## Get the app
1. Push this repo to GitHub.
2. Open the repo > Actions > latest "build" run > download the `MacroTracker-apk` artifact (contains `MacroTracker.apk`).
   Tagging a commit `v1.2` (any `v*`) also attaches the APK to a GitHub Release.
3. Copy the APK to the phone and install it (allow "install unknown apps" once).

## First install over the OLD Macros.apk
The old APK was signed with a different key, so Android will not update it in place. In the OLD app: Backup > Export to file.
Uninstall the old app, install the new one, then Backup > Import from file. Later builds update in place (same key).

## Develop / test
- Test (no Android needed): `node tools/test_logic.js`
- App page: `app/src/main/assets/index.html` (one file: HTML + CSS + JS). Android wrapper: `app/src/main/java/com/macrotracker/app/MainActivity.java`.
- Local build (needs Android SDK + Gradle 8.7 + JDK 17): `gradle assembleRelease`

## Docs
- `progress.md` - current state, decisions, rules, map, remaining work.
