Here is a production-ready implementation of a Rate Limiting middleware for PocketBase using Redis.

### Architecture Overview

1.  **Algorithm**: Sliding Window Log (using Redis Sorted Sets). This is more accurate than a "fixed window" because it tracks the exact timestamp of every request.
2.  **Storage**: Redis is required for distributed accuracy (if you run multiple PocketBase instances) and performance.
3.  **Logic**:
    *   We use a Sorted Set where the **Score** is the request timestamp.
    *   To check the rate, we remove items older than 1 minute and count the remaining items.
4.  **Bypass**: We check the standard PocketBase Authorization header. If a valid token is present, the middleware skips the check.

### Prerequisites

You need a Redis instance running. You also need the official Go Redis client:
```bash
go get github.com/redis/go-redis/v9
```

### The Code

Create a file named `ratelimit.go` (or place this in your `go.mod` project).

```go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/redis/go-redis/v9"
)

// rateLimitConfig holds the configuration for the middleware
type rateLimitConfig struct {
	redisClient *redis.Client
	limit       int64
	window      time.Duration
}

// RateLimitMiddleware returns an Echo middleware function
func RateLimitMiddleware(app *pocketbase.PocketBase, rdb *redis.Client) echo.MiddlewareFunc {
	cfg := rateLimitConfig{
		redisClient: rdb,
		limit:       100, // 100 requests
		window:      1 * time.Minute,
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// 1. BYPASS: Check if user is authenticated
			// Pocketbase stores the auth record in the context if standard auth was used.
			authRecord := c.Get("authData") // Standard PocketBase context key
			if authRecord != nil {
				// User is logged in, skip rate limiting
				return next(c)
			}

			// 2. IDENTIFY: Get IP Address
			// Check X-Forwarded-For first (Proxies/Load Balancers), then RemoteAddr
			ip := c.Request().Header.Get("X-Forwarded-For")
			if ip == "" {
				ip = c.Request().RemoteAddr
			}

			// 3. CHECK: Sliding Window Logic in Redis
			ctx := context.Background()
			key := fmt.Sprintf("ratelimit:%s", ip)
			now := time.Now().UnixNano() / int64(time.Millisecond) // Current time in ms

			// Pipe commands for atomic execution (Performance)
			pipe := rdb.Pipeline()

			// Remove entries older than the window (now - window_ms)
			windowMs := int64(cfg.window.Seconds() * 1000)
			pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(now-windowMs, 10))

			// Count remaining entries in the window
			countCmd := pipe.ZCard(ctx, key)

			// Execute pipeline
			_, err := pipe.Exec(ctx)
			if err != nil && err != redis.Nil {
				// If Redis is down, you might want to fail-open (allow) or fail-closed (block).
				// Here we log error and fail-open to not break the site completely.
				app.Logger().Error("Rate limit Redis error", "error", err)
				return next(c)
			}

			currentCount := countCmd.Val()

			// 4. ACTION: Allow or Block
			if currentCount >= cfg.limit {
				// Rate limit exceeded
				c.Response().Header().Set("X-RateLimit-Limit", strconv.FormatInt(cfg.limit, 10))
				c.Response().Header().Set("X-RateLimit-Remaining", "0")
				c.Response().Header().Set("Retry-After", strconv.FormatInt(int64(cfg.window.Seconds()), 10))

				return c.JSON(http.StatusTooManyRequests, map[string]string{
					"message": "Rate limit exceeded. Please try again later.",
				})
			}

			// 5. UPDATE: Add current request to the log
			// We add the member with the score being the current timestamp.
			// We also set an expiry on the key to auto-cleanup if no requests come in.
			rdb.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: now})
			rdb.Expire(ctx, key, cfg.window)

			// Set headers for allowed request
			c.Response().Header().Set("X-RateLimit-Limit", strconv.FormatInt(cfg.limit, 10))
			c.Response().Header().Set("X-RateLimit-Remaining", strconv.FormatInt(cfg.limit-currentCount-1, 10))

			return next(c)
		}
	}
}

// Setup function to initialize Redis and hook the middleware
func SetupRateLimit(app *pocketbase.PocketBase) {
	// Initialize Redis Client
	redisAddr := os.Getenv("REDIS_ADDRESS")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: os.Getenv("REDIS_PASSWORD"), // Optional
		DB:       0,                           // Use default DB
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Printf("Warning: Could not connect to Redis at %s: %v. Rate limiting is DISABLED.", redisAddr, err)
		return
	}

	// Hook into the OnBeforeServe route event
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// Apply to all API routes under /api/
		// You can adjust the route logic to exclude public static files if necessary
		e.Router.GET("/api/*", nil, RateLimitMiddleware(app, rdb)) 
		e.Router.POST("/api/*", nil, RateLimitMiddleware(app, rdb))
		e.Router.PUT("/api/*", nil, RateLimitMiddleware(app, rdb))
		e.Router.PATCH("/api/*", nil, RateLimitMiddleware(app, rdb))
		e.Router.DELETE("/api/*", nil, RateLimitMiddleware(app, rdb))

		return nil
	})
}
```

### How to Integrate

Modify your `main.go` to call this setup function.

```go
package main

import (
	"log"

	"github.com/pocketbase/pocketbase"
)

func main() {
	app := pocketbase.New()

	// Initialize the Rate Limiting
	SetupRateLimit(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
```

### Key Implementation Details for Production

1.  **Atomicity with Pipeline**: We use `rdb.Pipeline()`. This sends the cleanup (remove old items) and the count check to Redis in a single network round trip. This reduces latency significantly compared to sending commands sequentially.
2.  **IP Extraction**: We check `X-Forwarded-For`. This is crucial in production where PocketBase is likely behind a reverse proxy (Nginx, Traefik, Caddy). Without this, you would rate limit the proxy's IP, effectively blocking all your users at once.
3.  **Fail-Open Strategy**: In the code block `if err != nil ... return next(c)`, if Redis crashes, the request is allowed.
    *   *Why?* If Redis goes down, taking down your entire application (Fail-Closed) is often worse than temporarily disabling rate limiting. You can add a specific alert (e.g., Sentry) on that error line to notify you immediately.
4.  **Memory Cleanup**: `rdb.Expire(ctx, key, cfg.window)` ensures that if a user stops making requests, the Sorted Set is automatically deleted from Redis to save memory.

### Configuration via Environment Variables

You can configure the Redis connection by setting these environment variables before starting PocketBase:

```bash
export REDIS_ADDRESS="redis:6379"
export REDIS_PASSWORD="yourpassword"
./pocketbase serve
```
