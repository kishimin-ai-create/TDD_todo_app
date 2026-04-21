import { describe, expect, it } from 'vitest';

import app from './index';

describe('GET /', () => {
  it('when the root endpoint is requested, then it returns the greeting text', async () => {
    const response = await app.request('http://localhost/');

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('Hello Hono!');
  });
});
