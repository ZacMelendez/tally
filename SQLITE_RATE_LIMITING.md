# SQLite Rate Limiting Implementation

This project now includes a local SQLite-based rate limiting system that replaces the previous Upstash Redis dependency. This provides better privacy, lower latency, and eliminates external service dependencies.

## 🌟 Features

-   **🏠 Local Storage**: All rate limiting data stored locally in SQLite
-   **⚡ High Performance**: Optimized queries with proper indexing
-   **🔄 Automatic Cleanup**: Expired entries are automatically removed
-   **📊 Multiple Actions**: Different rate limits for different operations
-   **🛡️ Fallback Safe**: Graceful degradation if rate limiting fails
-   **📈 Monitoring**: Built-in statistics and monitoring endpoints

## 🏗️ Architecture

### Backend Components

1. **SQLiteRateLimitService** (`api/src/services/sqliteRateLimitService.ts`)

    - Core rate limiting logic using SQLite
    - Sliding window rate limiting algorithm
    - Automatic cleanup of expired entries
    - Statistics and monitoring capabilities

2. **Rate Limiting Middleware** (`api/src/middleware/rateLimit.ts`)

    - Fastify middleware for different actions
    - HTTP header injection for rate limit info
    - Graceful error handling

3. **Database Scripts** (`api/scripts/init-rate-limit-db.ts`)
    - Database initialization and setup
    - Sample data generation for testing
    - Cleanup and maintenance utilities

### Frontend Components

1. **BackendRateLimitService** (`src/services/backendRateLimitService.ts`)

    - Frontend service to communicate with backend rate limiting
    - Caching for performance
    - User-friendly error messages

2. **useBackendRateLimit Hook** (`src/hooks/useBackendRateLimit.ts`)
    - React hook for easy integration
    - Real-time rate limit checking
    - Toast notifications for limit violations

## 🚀 Setup and Usage

### 1. Initialize the Database

```bash
cd api
bun run db:init        # Initialize empty database
bun run db:sample      # Initialize with sample data
bun run db:reset       # Reset database (delete and recreate)
bun run db:cleanup     # Clean up expired entries
```

### 2. Start the API Server

```bash
cd api
bun run dev
```

The rate limiting database will be created automatically at `api/data/rate_limits.db`.

### 3. Frontend Integration

The frontend components have been updated to use the new backend rate limiting:

```typescript
import { useBackendRateLimit } from "../hooks/useBackendRateLimit";

const MyComponent = () => {
    const { checkRateLimit, rateLimitInfo } = useBackendRateLimit();

    const handleAction = async () => {
        const allowed = await checkRateLimit("add-asset");
        if (allowed) {
            // Proceed with the action
        }
        // Rate limit violation is automatically handled with toast
    };
};
```

## ⚙️ Rate Limit Configuration

Current rate limits (configurable in `sqliteRateLimitService.ts`):

| Action       | Limit        | Window    |
| ------------ | ------------ | --------- |
| add-asset    | 10 requests  | 1 minute  |
| add-debt     | 10 requests  | 1 minute  |
| update-asset | 20 requests  | 1 minute  |
| update-debt  | 20 requests  | 1 minute  |
| delete-item  | 15 requests  | 1 minute  |
| auth         | 5 requests   | 5 minutes |
| global       | 100 requests | 1 minute  |

## 📊 Monitoring Endpoints

### Rate Limit Info

```
GET /api/rate-limit/info
```

Returns current rate limit status for the authenticated user.

### Rate Limit Statistics

```
GET /api/rate-limit/stats
```

Returns global rate limiting statistics (useful for monitoring).

## 🗃️ Database Schema

### rate_limits Table

```sql
CREATE TABLE rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,           -- user:123 or ip:192.168.1.1
    action TEXT NOT NULL,               -- add-asset, update-debt, etc.
    count INTEGER NOT NULL DEFAULT 1,   -- number of requests in window
    window_start INTEGER NOT NULL,      -- window start timestamp (ms)
    window_end INTEGER NOT NULL,        -- window end timestamp (ms)
    created_at INTEGER NOT NULL,        -- creation timestamp
    updated_at INTEGER NOT NULL,        -- last update timestamp
    UNIQUE(identifier, action, window_start)
);
```

### Indexes

-   `idx_rate_limits_lookup`: Fast lookups by identifier, action, and window_end
-   `idx_rate_limits_window_end`: Efficient cleanup of expired entries
-   `idx_rate_limits_cleanup`: Optimized cleanup queries

### rate_limits_view

A convenient view for querying active rate limits:

```sql
CREATE VIEW rate_limits_view AS
SELECT
    identifier,
    action,
    SUM(count) as total_count,
    MIN(window_start) as earliest_window,
    MAX(window_end) as latest_window,
    COUNT(*) as active_windows,
    MAX(updated_at) as last_activity
FROM rate_limits
WHERE window_end > strftime('%s', 'now') * 1000
GROUP BY identifier, action;
```

## 🔄 Migration from Upstash

The migration replaces these components:

-   ❌ `@upstash/ratelimit` and `@upstash/redis` dependencies
-   ❌ `useSecureRateLimit` hook
-   ❌ `rateLimitService` (Upstash-based)
-   ❌ Environment variables for Upstash credentials

With:

-   ✅ `better-sqlite3` local database
-   ✅ `useBackendRateLimit` hook
-   ✅ `SQLiteRateLimitService`
-   ✅ No external service dependencies

## 🛠️ Maintenance

### Automatic Cleanup

The system automatically cleans up expired entries every 5 minutes. You can also run manual cleanup:

```bash
bun run db:cleanup
```

### Database Size Management

The SQLite database will grow over time. Regular cleanup and occasional VACUUM operations help maintain performance:

```sql
-- Manual cleanup and vacuum
DELETE FROM rate_limits WHERE window_end < strftime('%s', 'now') * 1000;
VACUUM;
```

### Monitoring

Monitor the rate limiting system using:

1. **API Statistics**: `GET /api/rate-limit/stats`
2. **Database Size**: Check `api/data/rate_limits.db` file size
3. **Performance**: Monitor API response times for rate-limited endpoints

## 🚨 Troubleshooting

### Database Issues

**Problem**: Database file permissions error
**Solution**: Ensure the API has write permissions to the `api/data/` directory

**Problem**: Database corruption
**Solution**: Delete the database file and run `bun run db:init`

### Rate Limiting Not Working

**Problem**: Rate limiting seems disabled
**Solution**: Check that the middleware is properly registered in server.ts

**Problem**: Frontend not respecting rate limits
**Solution**: Verify API endpoints return proper rate limit headers

### Performance Issues

**Problem**: Slow rate limit checks
**Solution**:

-   Run `ANALYZE` on the database
-   Ensure indexes are present
-   Consider running cleanup more frequently

## 📝 Development Notes

-   Rate limiting is applied at the API middleware level
-   Frontend checks are advisory; backend enforcement is authoritative
-   The system gracefully degrades if the database is unavailable
-   All timestamps are stored in milliseconds since epoch
-   The sliding window algorithm prevents burst traffic while allowing steady usage

## 🔮 Future Enhancements

-   [ ] Rate limit configuration via environment variables
-   [ ] Redis compatibility layer for distributed deployments
-   [ ] Rate limit bypass for admin users
-   [ ] More sophisticated rate limiting algorithms (token bucket, etc.)
-   [ ] Rate limit warming for new users
-   [ ] Integration with application metrics/monitoring
