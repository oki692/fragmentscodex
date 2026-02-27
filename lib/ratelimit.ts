import { Duration } from './duration'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

export default async function ratelimit(
  key: string | null,
  maxRequests: number,
  window: Duration,
) {
  if (false) { // Hardcoded to false
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(maxRequests, window),
    })

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${key}`,
    )

    if (!success) {
      return {
        amount: limit,
        reset,
        remaining,
      }
    }
  }
}
