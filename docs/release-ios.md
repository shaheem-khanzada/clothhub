# Releasing the iOS app (TestFlight)

Builds run on Expo's build service (EAS) and go to App Store Connect, where TestFlight
hands them to testers. Commands run from `apps/mobile`.

## Once

You need an [Expo account](https://expo.dev/signup) and an Apple Developer Program membership.

```bash
cd apps/mobile
npx eas-cli@latest login     # Expo account
npx eas-cli@latest init      # links the app to an Expo project; adds extra.eas.projectId to app.json
```

Commit the `app.json` change `eas init` makes.

## Each release

```bash
cd apps/mobile
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

- The first build asks you to sign in to Apple. EAS then creates the app ID, the
  distribution certificate and the provisioning profile, and keeps them for later builds.
- `--auto-submit` uploads the finished build to App Store Connect (creating the app record
  there on the first run). Apple processes it for 5–15 minutes; it then appears under
  **TestFlight**.
- The build number goes up by itself (`autoIncrement`, stored on EAS). Raise `version` in
  `app.json` for a new marketing version (1.0.0 → 1.1.0).
- The build reads its API address from `eas.json` (`EXPO_PUBLIC_API_URL`), not from
  `.env.local`, which stays on your computer.

## Testers

- **Internal testers** (people on your App Store Connect team, up to 100) can install as
  soon as Apple has processed the build: App Store Connect → the app → TestFlight → Internal
  Testing → add them.
- **External testers** (anyone, by email or a public link) need a short Beta App Review the
  first time: add a test group, a description, and a contact email.

## Before the public release

- Point `EXPO_PUBLIC_API_URL` in `eas.json` at the production API once it exists (today it
  is the development API).
- App Store listing: screenshots, description, privacy policy URL, and the privacy
  questionnaire (the app collects no personal data in V1; favourites stay on the device).
