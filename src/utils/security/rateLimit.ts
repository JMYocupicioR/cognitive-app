import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 5, // Number of points
  duration: 60, // Per 60 seconds
});

export async function checkRateLimit(key: string): Promise<boolean> {
  try {
    await rateLimiter.consume(key);
    return true;
  } catch (error) {
    return false;
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  await rateLimiter.delete(key);
}