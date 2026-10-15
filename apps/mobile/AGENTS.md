# AGENTS.md — ClothHub mobile (`@clothhub/mobile`)

This app is one workspace of the ClothHub monorepo. The root `AGENTS.md` covers
rules that span the app, the API and `@clothhub/shared`; install dependencies
from the repo root only.

ClothHub is a Pakistan-first fashion discovery app: products from many brands in one place. This repo is the V1 mobile app (Expo + React Native + TypeScript). It follows the same conventions as the NaqaD app.

## V1 scope

The app has three screens: Brands, then a brand's Products, then the Product reel with its detail sheet.

Data comes from the ClothHub API (`apps/api`). There is no login yet: favourites (the heart) are saved on the device. Collections are out of scope. Do not add features outside this scope without being asked.

## Architecture

```text
src/
  app/            Expo Router routes. Thin: each one imports a view and renders it.
  views/<Name>View/
    index.tsx     The screen.
    components/   Pieces used only by that screen.
  components/
    ui/           Design-system primitives (Text, Button, Chip, Switch, RangeSlider…).
    catalog/      Catalog pieces shared by more than one screen.
    brand/        The ClothHub mark (logoGeometry.ts), BrandMark, and the animated LaunchSplash.
  domain/catalog/ types, mapper, api, queryKeys, query hooks, browse store.
  domain/auth/    the sign-in seam: useSession(), useRequireAccount().
  domain/favorites/ the hearts, on the device (Zustand + MMKV).
  axios/          the HTTP client and ApiError.
  test-utils/     API response fixtures and a React Query test wrapper.
  constants/      colors, typography, spacing, layout. Import them via '@/constants/theme'.
  lib/            queryClient, queryPersistence, mmkv, formatters, images, photoMetrics, feedback (haptics).
i18next/          i18next setup and the en locale.
assets/icons/     24×24 SVGs that use currentColor, exposed through <Icon name="…" />.
```

## Rules

### State

- Server data goes through React Query. Screens never call `api.ts` directly.
- Client state shared across screens goes in Zustand. Today that is only `useBrowseStore`: per-brand sort, filters and search.
  - The product list and the reel read the same params, so they share one cache entry.
- MMKV is only for deliberate persistence: "gesture guide seen", favourites, and the saved query cache.
- The brand list and the first page of recently visited product lists are saved to MMKV (`lib/queryPersistence.ts`) for an instant cold start. Bump `QUERY_CACHE_VERSION` when a saved response shape changes.
- Actions that will belong to an account (saving, collecting) go through `useRequireAccount()` — today it runs them on the device; with sign-in it opens the sign-in sheet first.
- A sheet keeps its draft state locally and commits it on Apply.

### Data

- The API contract lives in `@clothhub/shared`. `api.ts` parses every response with those schemas, then `mapper.ts` turns it into `Brand` / `Product`.
- Screens only see `Brand` and `Product` (`domain/catalog/types.ts`), never the API shapes.
- Requests go through `apiClient` (`src/axios`). Failures arrive as `ApiError` with the API's `code` (`not_found`, `invalid_request`) or `network_error` / `timeout`. React Query retries only network and server errors (`lib/queryClient.ts`).
- The API URL comes from `EXPO_PUBLIC_API_URL`: `.env.local` on your computer (see `.env.example`), the build profile's `env` in `eas.json` for TestFlight and store builds (see `docs/release-ios.md`).
- Text clean-up (names, sizes, fabric, description parts) happens in the API's ingest job, not here.

### Brand

- The mark (a hanger whose hook is a "C") is described once, in `src/components/brand/logoGeometry.ts`.
  - `npm run brand:assets -w @clothhub/mobile` renders the app icon, the Android adaptive and themed icons, the native launch image and `assets/brand/*.svg` from it. Change the geometry, re-run, commit the images; never edit them by hand.
  - `assets/brand/mark.svg` is the vector to use elsewhere, e.g. in Apple's Icon Composer for a Liquid Glass icon.
- `LaunchSplash` takes over from the native launch screen on an identical frame, plays for about 1.7 s (swing, light along the hanger, the name), then fades into the app. A tap skips it; Reduce Motion shortens it to a fade.
  - `LAUNCH_MARK_SIZE` must equal `imageWidth` of `expo-splash-screen` in `app.json`; a test checks it.

### UI

- The app is dark only. Colours come from `useTheme()` tokens; never use raw hex in views.
- Use `Typography` presets and `Spacing` tokens, with `StyleSheet.create`.
- All copy goes through `t()`. Add keys to `i18next/locales/en.ts`.
- Sheets use `@lodev09/react-native-true-sheet`. Present and dismiss them by name.
  - The reel's product sheet stays presented the whole time. Anything that must sit above it renders in `TrueSheetOverlay`.
- Haptics go through `feedback.*`, named by event (tap, select, toggle, page, unavailable).
- Product and brand photos render through `ProductImage`, never `expo-image` directly.
  - What shows while a photo loads, best first: a copy already shown elsewhere (`placeholderUri`), the API's ThumbHash (`thumbhash`) with a moving `Glint`, or a blurred 32 px preview over the tinted `SilkSheen`. Then the full photo cross-dissolves in.
  - Pass `tone={toneOf(product.colors)}`, `thumbhash={product.coverThumbhash}` for covers, and `recyclingKey` in recycled lists. Use `preview={false}` for small thumbnails and `density={PhotoDensity.full}` for full-screen photos (everything else is capped at 2×).
  - Photo URLs come only from `photoUrl()` (`lib/images.ts`): it rounds widths to shared sizes so views reuse cached files. Prefetch with `prefetchPhotos(photoUrl(...))` so a prefetched file is exactly the one a view asks for.
  - Prefetch only within `usePrefetchBudget()`: far ahead on Wi-Fi, one step on mobile data, nothing offline.
  - Loading placeholders for photo areas use `SilkSheen`, not the grey `Skeleton`, so the skeleton and the photo share one surface. All sheens run on one shared clock (`sheenClock.ts`).
  - In development, the Metro log prints a `[photos]` line every 50 photos: cache hits, network timings, size and format. Check it after any change to images.
- Lists use `LegendList` (`@legendapp/list/react-native`), never `FlatList`.
  - Pass `recycleItems` when rows hold no state of their own (cards); leave it off for stateful rows (reel items).
  - Give rows a stable callback that takes the item (`onPress(product)`), not a new arrow per row. React Compiler memoizes the rest; don't add `memo` or `useCallback` by hand.
- Floating controls over photos use `GlassIconButton`. It renders Liquid Glass on iOS 26 and a frosted disc elsewhere.
- On iOS, prefer native controls where they give the platform feel:
  - Screen-level buttons go in `Stack.Toolbar` with SF Symbols. Native menus use `Stack.Toolbar.Menu`.
  - Glass buttons over photos use `@expo/ui/swift-ui` `Button` with `buttonStyle('glass')`.
  - Do not pass a tint to either; Liquid Glass chooses a light or dark symbol from what is behind it.
  - Android keeps the drawn equivalents, because native toolbar icons there must be bitmaps.

### Quality

- Run `npm run typecheck` and `npm test` before handing work back.
- Tests are Jest (jest-expo) + React Native Testing Library, next to the code as `*.test.ts(x)`. `render` and `renderHook` are async (`await render(…)`). Mock HTTP with `axios-mock-adapter` on `apiClient`; build responses with `test-utils/fixtures`.
- React Compiler is on: no ref reads or shared-value writes during render.
- Native modules are used (MMKV, TrueSheet, Pulsar, glass), so use a dev build. Expo Go is not supported.
