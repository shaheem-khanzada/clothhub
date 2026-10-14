/**
 * @clothhub/shared — the contract between the API and the mobile app.
 *
 * Every request and response the API exposes is described here once, as a
 * Zod schema, with its TypeScript type inferred from it:
 * - the API validates input and output against these schemas, and generates
 *   its OpenAPI document from them (`.meta({ id })` names the component);
 * - the mobile app parses responses with them.
 *
 * A breaking change therefore fails the typecheck on both sides in the same
 * pull request.
 *
 * Layout, one folder per API module:
 *   src/common/   errors
 *   src/catalog/  brands, products, filters, facets, image URLs
 *   src/me/       the signed-in user's saves and collections (after sign-in)
 *
 * Shipped as TypeScript source: Metro and the API's bundler compile it
 * directly, so there is no build step to forget. Plain `zod` only — no
 * framework imports — so the app can use it too.
 */

export * from './catalog/brands';
export * from './catalog/images';
export * from './catalog/products';
export * from './common/errors';
