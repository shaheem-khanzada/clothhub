# AGENTS.md — ClothHub mobile (`@clothhub/mobile`)

This app is one workspace of the ClothHub monorepo. The root `AGENTS.md` covers
rules that span the app, the API and `@clothhub/shared`; install dependencies
from the repo root only.

ClothHub is a Pakistan-first fashion discovery app: products from many brands in one place. This repo is the V1 mobile app (Expo + React Native + TypeScript). It follows the same conventions as the NaqaD app.

## V1 scope

The app has three screens: Brands, then a brand's Products, then the Product reel with its detail sheet.

There is no login and no backend. Favourites and collections are out of scope; the heart shows "Coming soon". Do not add features outside this scope without being asked.

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
  mocks/catalog/  Scraped sample data and a fake server (filter, sort, paging, facets).
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
- MMKV is only for deliberate persistence. Today that is only "gesture guide seen".
- A sheet keeps its draft state locally and commits it on Apply.

### Data

- `ProductDto` and `BrandDto` mirror the scraper's output exactly.
- `mapper.ts` is the only place that knows about each brand's quirks.
- Screens only see `Product` and `Brand`.
- To switch to a real API, replace the bodies in `api.ts` with `apiClient` calls and map the responses. The signatures stay the same.

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

- Run `npm run typecheck` before handing work back.
- React Compiler is on: no ref reads or shared-value writes during render.
- Native modules are used (MMKV, TrueSheet, Pulsar, glass), so use a dev build. Expo Go is not supported.
