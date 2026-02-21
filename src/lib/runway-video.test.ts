import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateVideoWithRunway } from './runway-video';

// Lightweight unit test that doesn't hit Runway.
// Verifies we fail fast without an API key (avoids network calls in CI).

describe('runway-video', () => {
  it('fails fast when RUNWAY_API_KEY is missing', async () => {
    const original = process.env.RUNWAY_API_KEY;
    delete process.env.RUNWAY_API_KEY;

    const res = await generateVideoWithRunway('test prompt', { duration: 1 });

    assert.equal(res.success, false);
    assert.match(res.error ?? '', /RUNWAY_API_KEY not configured/);

    if (original) process.env.RUNWAY_API_KEY = original;
  });
});
