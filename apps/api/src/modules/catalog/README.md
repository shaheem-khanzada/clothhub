# catalog

Brands, products, filters, facets and search — served from ClothHub's own
`catalog.*` tables, which the ingest job fills.

Planned (see docs/architecture.md):
- `GET /v1/brands`
- `GET /v1/brands/:brandId/products`
- `GET /v1/products/:productId`

Layout when built: `routes.ts` (HTTP + OpenAPI), `service.ts` (queries),
`schema.ts` re-exported from `@clothhub/shared`.
