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
   - Right-side actions: save (kept on the device until accounts exist), share and visit brand.
   - A persistent product card that drags up to show the description, sizes and product details, with a "Visit Brand" button.
   - A first-run swipe guide, which can be reopened from the ⋮ menu.

## Run it

```bash
npm install                      # from the repo root — installs every workspace
cp apps/mobile/.env.example apps/mobile/.env.local   # then set EXPO_PUBLIC_API_URL
cd apps/mobile
npx expo run:ios                 # or: npx expo run:android
```

`EXPO_PUBLIC_API_URL` points the app at an API: your Mac (`npm run api` at the repo root), or the dev server on Coolify. See `.env.example` for the address to use on a simulator, an emulator or a phone.

The app uses native modules (MMKV, TrueSheet, Pulsar haptics, Liquid Glass), so it needs a development build. It does not run in Expo Go.

```bash
npm run typecheck
npm test                         # Jest + React Native Testing Library
```

## Data

Everything comes from the ClothHub API (`apps/api`): brands, products, filters, search and paging. `src/domain/catalog/api.ts` calls it through `src/axios` and checks every response against the shared contract (`@clothhub/shared`) before mapping it for the screens.

The app shows women's clothing (stitched and unstitched) from the brands the scraper syncs. Product photos load from Shopify's CDN, resized to what the screen needs.

## Not in V1

- Accounts (favourites stay on the device until then)
- Collections
- Help Me Choose
- Following
- Light mode
- Languages other than English

See `AGENTS.md` for conventions.
