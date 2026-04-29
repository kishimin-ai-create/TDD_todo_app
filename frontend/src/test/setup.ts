import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Unmount all rendered components so DOM state does not leak between tests.
  // Required because vite.config.ts does not set globals:true, which means
  // @testing-library/react cannot auto-register cleanup via globalThis.afterEach.
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
