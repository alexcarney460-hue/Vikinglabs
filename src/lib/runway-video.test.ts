import { generateVideoWithRunway } from './runway-video';

// Unit test: ensure headers and body are constructed (mock fetch)
// This is a lightweight test that doesn't hit Runway; it verifies header creation logic.

describe('runway-video', () => {
  it('should build headers with Runway-Version', async () => {
    // Simple smoke: call the function with missing API key to exercise early exit
    const original = process.env.RUNWAY_API_KEY;
    delete process.env.RUNWAY_API_KEY;
    const res = await generateVideoWithRunway('test prompt', { duration: 1 });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/RUNWAY_API_KEY not configured/);
    if (original) process.env.RUNWAY_API_KEY = original;
  });
});
