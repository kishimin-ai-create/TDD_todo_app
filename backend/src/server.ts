import { serve } from '@hono/node-server';
import honoApp from './index';

const port = Number(process.env.PORT ?? 3000);

serve({
  fetch: honoApp.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);
