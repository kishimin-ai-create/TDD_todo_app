import { describe, expect, it } from 'vitest';

import { request } from '../helpers';

describe('GET /', () => {
  it('when the root endpoint is requested, then it returns the greeting text', async () => {
    const response = await request('GET', '/');

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('Hello Hono!');
  });
});
