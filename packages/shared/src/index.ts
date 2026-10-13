/**
 * @clothhub/shared — the contract between the API and the mobile app.
 *
 * Every request and response the API exposes is described here once, as a
 * Zod schema, with its TypeScript type inferred from it:
 * - the API validates input and output against these schemas, and generates
 *   its OpenAPI document from them;
 * - the mobile app parses responses with them.
 *
 * A breaking change therefore fails the typecheck on both sides in the same
 * pull request.
 *
 * Layout, one folder per API module (added as each module is built):
 *   src/common/   pagination, errors, ids, money
 *   src/catalog/  brands, products, filters, facets
 *   src/me/       the signed-in user's saves and collections (after sign-in)
 *
 * Shipped as TypeScript source: Metro and the API's bundler compile it
 * directly, so there is no build step to forget.
 */

export {};
