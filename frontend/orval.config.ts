import { defineConfig } from 'orval';

export default defineConfig({
  todoApp: {
    input: {
      target: '../docs/spec/backend/openapi-generated-pretty.json',
    },
    output: {
      mode: 'split',
      target: 'src/api/generated/index.ts',
      schemas: 'src/api/generated/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: {
        type: 'msw',
      },
      clean: true,
      override: {
        mutator: {
          path: 'src/api/client.ts',
          name: 'customFetch',
        },
      },
    },
  },
});
