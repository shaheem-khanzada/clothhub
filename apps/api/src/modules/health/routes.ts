import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

const HealthSchema = z
  .object({
    status: z.literal('ok'),
  })
  .openapi('Health');

const route = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Liveness check for Coolify',
  responses: {
    200: {
      description: 'The API is up',
      content: { 'application/json': { schema: HealthSchema } },
    },
  },
});

export const healthRoutes = new OpenAPIHono().openapi(route, (c) =>
  c.json({ status: 'ok' as const }, 200),
);
