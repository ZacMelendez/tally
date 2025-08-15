# Upstash KV Rate Limiting Setup

This guide will help you set up secure, distributed rate limiting using Upstash Redis for your Net Worth application.

## Why Upstash KV Rate Limiting?

Your current rate limiting implementation has security vulnerabilities:

-   ❌ Client-side only (easily bypassed)
-   ❌ Resets on page refresh
-   ❌ No cross-device/session persistence
-   ❌ No server-side enforcement

The new Upstash implementation provides:

-   ✅ Server-side enforcement
-   ✅ Distributed rate limiting across devices
-   ✅ Persistent across sessions
-   ✅ Multiple algorithms (sliding window, token bucket)
-   ✅ Automatic fallback to local storage
-   ✅ Built-in analytics and monitoring

## Setup Instructions

### 1. Create an Upstash Account

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up for a free account
3. Create a new Redis database:
    - Choose a region close to your users
    - Select "Global" for better performance
    - Enable "TLS" for security

### 2. Get Your Credentials

From your Upstash dashboard:

1. Click on your Redis database
2. Copy the following values:
    - `UPSTASH_REDIS_REST_URL`
    - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configure Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Upstash Redis Configuration
VITE_UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

**Important Security Notes:**

-   Never commit these credentials to version control
-   Use different databases for development and production
-   Rotate tokens regularly
-   Consider using environment-specific configurations

### 4. Update Your Application

The new rate limiting system is now available through:

```typescript
import { useSecureRateLimit } from "./hooks/useSecureRateLimit";

// In your component
const { checkRateLimit, isLoading } = useSecureRateLimit();

// Before making API calls
const canProceed = await checkRateLimit("add-asset");
if (!canProceed) {
    return; // Rate limit exceeded, user will see toast notification
}
```

### 5. Migration from Old System

Replace the old `useRateLimit` hook with `useSecureRateLimit`:

```typescript
// Old (insecure)
import { useRateLimit } from "./hooks/useRateLimit";
const { checkRateLimit } = useRateLimit();
if (!checkRateLimit(action)) return;

// New (secure)
import { useSecureRateLimit } from "./hooks/useSecureRateLimit";
const { checkRateLimit } = useSecureRateLimit();
if (!(await checkRateLimit(action))) return;
```

## Rate Limit Configuration

The system includes these predefined limits:

| Action       | Limit        | Window      |
| ------------ | ------------ | ----------- |
| add-asset    | 10 requests  | 60 seconds  |
| add-debt     | 10 requests  | 60 seconds  |
| update-asset | 20 requests  | 60 seconds  |
| update-debt  | 20 requests  | 60 seconds  |
| delete-item  | 15 requests  | 60 seconds  |
| auth         | 5 requests   | 300 seconds |
| global       | 100 requests | 60 seconds  |

## Fallback Behavior

If Upstash is unavailable, the system automatically falls back to:

1. Local storage-based rate limiting (less secure but functional)
2. If that fails, requests are allowed with logging

## Monitoring and Analytics

With `analytics: true` enabled, you can monitor:

-   Request patterns in your Upstash dashboard
-   Rate limit violations
-   Performance metrics
-   Geographic distribution

## Production Considerations

1. **Multiple Regions**: Consider using `MultiRegionRatelimit` for global applications
2. **Caching**: The system includes ephemeral caching for performance
3. **Timeouts**: 1-second timeout prevents network issues from blocking requests
4. **Error Handling**: Graceful degradation ensures availability

## Testing

Test your setup:

```typescript
// Test rate limiting
const { checkRateLimit } = useSecureRateLimit();

// This should work
console.log(await checkRateLimit("add-asset")); // true

// Spam requests to trigger rate limit
for (let i = 0; i < 15; i++) {
    console.log(await checkRateLimit("add-asset"));
}
// Should start returning false after 10 requests
```

## Troubleshooting

1. **Rate limiting not working**: Check environment variables
2. **Always allows requests**: Verify Upstash credentials
3. **Performance issues**: Enable caching and check timeout settings
4. **Cross-device issues**: Ensure user authentication is working

## Security Best Practices

1. Use HTTPS in production
2. Rotate Upstash tokens regularly
3. Monitor for abuse patterns
4. Set appropriate rate limits for your use case
5. Log rate limit violations for security analysis
6. Consider IP-based limiting for anonymous users

Your application now has enterprise-grade rate limiting protection! 🔒
