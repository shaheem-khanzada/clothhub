# ClothHub

Pakistani women's fashion from many brands, in one place. This is the V1 mobile app, built with Expo SDK 57, React Native 0.86 and TypeScript.

## Screens

1. **Brands**
   - Large title and search.
   - A photo card for each brand, with its product count.
2. **Products** (per brand)
   - Native header with the product count and a search field.
   - Sort sheet with five orders.
   - Filters sheet: price range slider, type chips, in-stock and sale switches.
   - Two-column grid with infinite scroll and pull to refresh.
3. **Product reel**
   - Full-screen photos. Swipe up or down for the next or previous product, left or right for photos, or tap the sides.
   - Story-style progress segments and a thumbnail strip.
   - Top bar: close, share and a ⋮ menu.
   - Right-side actions: save (coming soon), share and visit brand.
   - A persistent product card that drags up to show the description, sizes and product details, with a "Visit Brand" button.
   - A first-run swipe guide, which can be reopened from the ⋮ menu.

## Run it

```bash
npm install             # from the repo root — installs every workspace
cd apps/mobile
npx expo run:ios        # or: npx expo run:android
```

The app uses native modules (MMKV, TrueSheet, Pulsar haptics, Liquid Glass), so it needs a development build. It does not run in Expo Go.

```bash
npm run typecheck
```

## Data

There is no API yet. `src/domain/catalog/api.ts` is served by `src/mocks/catalog/server.ts`, which works over 100 scraped products from Alkaram Studio and Asim Jofa.
- It adds realistic latency.
- It does filtering, sorting, paging and price/type facets on the "server".

Product photos load from the brands' own CDNs.

When the backend exists, swap the function bodies in `api.ts` for `apiClient` calls (`src/axios`, `EXPO_PUBLIC_API_URL`). Nothing else needs to change.

## Not in V1

- Accounts
- Favourites and collections
- Help Me Choose
- Following
- Light mode
- Languages other than English

See `AGENTS.md` for conventions.
