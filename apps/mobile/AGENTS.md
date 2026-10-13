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
  domain/catalog/ types, mapper, api, queryKeys, query hooks, browse store.
  domain/auth/    the sign-in seam: useSession(), useRequireAccount().
  domain/favorites/ the hearts, on the device (Zustand + MMKV).
  axios/          the HTTP client and ApiError.
  test-utils/     API response fixtures and a React Query test wrapper.
  constants/      colors, typography, spacing, layout. Import them via '@/constants/theme'.
  lib/            queryClient, mmkv, formatters, images, feedback (haptics).
i18next/          i18next setup and the en locale.
assets/icons/     24×24 SVGs that use currentColor, exposed through <Icon name="…" />.
```

## Rules

### State

- Server data goes through React Query. Screens never call `api.ts` directly.
- Client state shared across screens goes in Zustand. Today that is only `useBrowseStore`: per-brand sort, filters and search.
  - The product list and the reel read the same params, so they share one cache entry.
- MMKV is only for deliberate persistence: "gesture guide seen" and favourites.
- Actions that will belong to an account (saving, collecting) go through `useRequireAccount()` — today it runs them on the device; with sign-in it opens the sign-in sheet first.
- A sheet keeps its draft state locally and commits it on Apply.

### Data

- The API contract lives in `@clothhub/shared`. `api.ts` parses every response with those schemas, then `mapper.ts` turns it into `Brand` / `Product`.
- Screens only see `Brand` and `Product` (`domain/catalog/types.ts`), never the API shapes.
- Requests go through `apiClient` (`src/axios`). Failures arrive as `ApiError` with the API's `code` (`not_found`, `invalid_request`) or `network_error` / `timeout`. React Query retries only network and server errors (`lib/queryClient.ts`).
- The API URL comes from `EXPO_PUBLIC_API_URL` (`.env.local`, see `.env.example`).
- Text clean-up (names, sizes, fabric, description parts) happens in the API's ingest job, not here.

### UI

- The app is dark only. Colours come from `useTheme()` tokens; never use raw hex in views.
- Use `Typography` presets and `Spacing` tokens, with `StyleSheet.create`.
- All copy goes through `t()`. Add keys to `i18next/locales/en.ts`.
- Sheets use `@lodev09/react-native-true-sheet`. Present and dismiss them by name.
  - The reel's product sheet stays presented the whole time. Anything that must sit above it renders in `TrueSheetOverlay`.
- Haptics go through `feedback.*`, named by event (tap, select, toggle, page, unavailable).
- Product images are resized through `sizedImageUrl(url, px)` (Shopify CDN `width`).
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
