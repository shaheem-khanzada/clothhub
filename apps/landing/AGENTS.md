# AGENTS.md — ClothHub landing site (`@clothhub/landing`)

This app is one workspace of the ClothHub monorepo. The root `AGENTS.md` covers
rules that span workspaces; install dependencies from the repo root only.

The marketing page for ClothHub: one page that explains the app and collects
waitlist emails. Next.js 16 (App Router) + Tailwind CSS 4 + TypeScript. Every
section is a server component; only the waitlist form runs in the browser.

## Running it

```bash
npm run landing                          # from the repo root: http://localhost:3001
npm run build -w @clothhub/landing       # production build (standalone server)
npm run lint -w @clothhub/landing
npm run typecheck -w @clothhub/landing
```

It runs on port 3001 so it doesn't clash with the API on 3000.

## Architecture

```text
src/
  app/                 layout (font, metadata), page (the sections in order), globals.css (tokens), icons
  components/
    sections/          one file per page section, top to bottom: SiteHeader, Hero, CatalogueStats,
                       WhyClothHub, ReelShowcase, FeatureCards, BrandsBand, ComingNext,
                       JoinWaitlist, SiteFooter
    mockups/           the pictures: phones and their screens (phone/), the filter sheet, the chat,
                       the brand row, the clothes rack, the upcoming-feature cards
    ui/                primitives: Container, Photo, GlassCircle, Icon, Logo, ChatBubble, typography,
                       the cream button classes
    WaitlistForm.tsx   the only client component
  content/             what the page shows: products.ts, brands.ts, site.ts (catalogue numbers, links)
  assets/              product and brand photos (imported, so a missing file fails the build)
  fonts/               Bricolage Grotesque, variable (weight, width, optical size), OFL licensed
  lib/                 format (prices, counts), waitlist (the email endpoint), cx (class names)
```

## Rules

### Design

- The page follows the app's look: the palette is the app's (`apps/mobile/src/constants/colors.ts`),
  set as Tailwind tokens in `src/app/globals.css`. Use the token names (`bg-ink`, `text-fog`,
  `bg-cream`), never raw hex in components. The one exception is `ScreenshotPile`, whose colours
  imitate other brands' websites on purpose.
- Copy lives in the section components as plain JSX text, so it reads top to bottom like the page.
  Data the page repeats or computes from (products, brands, catalogue numbers, links) lives in
  `src/content`.
- The phone mockups mirror the app's screens; when a screen in the app changes, the matching file in
  `components/mockups/phone` says which view it mirrors.
- Animations are CSS only (keyframes in `globals.css`) and use `motion-safe:` so they stop for
  people who ask for reduced motion.
- Mockups are pictures: they are `aria-hidden`, with a screen-reader caption on the surrounding
  `<figure>`. Anything a visitor can use is a real `<a>`, `<button>` or `<input>`.
- No sideways scrolling at any width: the root wrapper clips overflow, and wide decorative rows
  (the brand row, the rack) clip themselves.

### Content

- Products and brands are real catalogue data. To show another piece, add its photo under
  `src/assets/products`, an entry in `content/products.ts`, and use it in a section.
- Don't show a sale badge or a discount unless the product really has one.
- `content/site.ts` holds the catalogue numbers from `/v1/brands`; refresh them before launch.

### Images

- Use `<Photo>` (next/image with `fill` and a blur placeholder). Its parent must be positioned
  (`relative` or `absolute`) and sized, and `sizes` must be the rendered width.
- Photos are about 800px wide JPEGs; Next.js serves resized AVIF/WebP copies.

### The waitlist

- `lib/waitlist.ts` POSTs `{ "email" }` to `NEXT_PUBLIC_WAITLIST_URL`. The API has no waitlist
  endpoint yet, so it is unset and the form says it couldn't add the address. When the endpoint
  exists, define its request schema in `@clothhub/shared` first (root rule) and set the variable.

### Quality

- Run `npm run lint` and `npm run typecheck` (or the root `npm run typecheck`) before handing work
  back. CI builds the site on every pull request.
