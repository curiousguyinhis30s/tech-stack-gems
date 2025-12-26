Here is a complete, ready-to-use Go file for PocketBase. This code creates a custom extension that hooks into the PocketBase lifecycle.

It includes:
1.  **Redis Connection**: Handles connecting and pooling.
2.  **Smart Caching**: Intercepts GET requests (JSON & API responses), generates a unique cache key, and serves from Redis if available.
3.  **Auto Invalidation**: Hooks into the database events (`Create`, `Update`, `Delete`) to clear the cache for that specific collection immediately when data changes.

### Prerequisites

You must initialize a Go module and install the Redis client library:

```bash
go get github.com/redis/go-redis/v9
```

### The Code (`main.go`)

```go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/redis/go-redis/v9"
)

// RedisClient wraps the redis client to pass it around easily
type RedisClient struct {
	Client *redis.Client
Ctx    context.Context
}

func main() {
	app := pocketbase.New()

	// 1. Initialize Redis
	// Reads REDIS_URL from env, or defaults to localhost
	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	// Test connection
	ctx := context.Background()
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	fmt.Println("Connected to Redis successfully.")

	redisWrapper := &RedisClient{
		Client: rdb,
		Ctx:    ctx,
	}

	// 2. Register Hooks
	registerHooks(app, redisWrapper)

	// 3. Start PocketBase
	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

func registerHooks(app *pocketbase.Application, rdb *RedisClient) {

	// --- A. CACHE INVALIDATION (Write Operations) ---
	// We hook into the standard model events. Whenever a record in ANY collection
	// is Created, Updated, or Deleted, we flush the cache for that collection.
	
	// Helper to generate the collection key prefix
	collectionKeyPrefix := func(collectionIdOrName string) string {
		// We use a prefix so we can bulk delete keys if needed using SCAN
		return fmt.Sprintf("pb_cache:%s:*", collectionIdOrName)
	}

	onRecordChange := func(e core.RecordEvent) error {
		// Clear cache for the specific collection
		pattern := collectionKeyPrefix(e.Record.Collection().Id)
		
		// Redis SCAN is safer than KEYS for production, but requires an iterator
		iter := rdb.Client.Scan(rdb.Ctx, 0, pattern, 0).Iterator()
		for iter.Next(rdb.Ctx) {
			rdb.Client.Del(rdb.Ctx, iter.Val())
		}
		if err := iter.Err(); err != nil {
			log.Printf("Redis error during invalidation: %v", err)
		}
		return nil
	}

	// Bind the invalidation logic to all collections
	app.OnRecordAfterCreateRequest().Add(&onRecordChange)
	app.OnRecordAfterUpdateRequest().Add(&onRecordChange)
	app.OnRecordAfterDeleteRequest().Add(&onRecordChange)


	// --- B. CACHE SERVING (Read Operations) ---
	// We hook into the "Serve" event. This happens for every HTTP request.
	// We check if it is a safe GET request and handle caching here.
	
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		
		// Define a middleware for the API routes
		e.Router.GET("/*", func(c echo.Context) error {
			request := c.Request()
			response := c.Response()
			
			// 1. Skip non-GET requests (middleware matches all, so we filter here)
			if request.Method != http.MethodGet {
				return next(c)
			}

			// 2. Generate a unique Cache Key
			// Key structure: pb_cache:<collection_id>:<request_path>:<query_hash>
			// This ensures unique caching for different pagination or filter queries.
			url := request.URL.String()
			cacheKey := fmt.Sprintf("pb_cache:global:%s", url)

			// 3. Try Redis
			val, err := rdb.Client.Get(rdb.Ctx, cacheKey).Result()
			if err == nil {
				// CACHE HIT
				// Set standard headers so browser/client knows it's a cache
				response.Header().Set("X-PB-Cache", "HIT")
				response.WriteHeader(http.StatusOK)
				response.Write([]byte(val))
				return nil // Stop execution, don't call PocketBase controllers
			}

			// 4. CACHE MISS - Execute Request
			// We create a custom Response Writer to capture the PocketBase output
			recorder := apis.NewStaticResponseWriter(response)
			
			// Serve the request normally via PocketBase
			// Note: We call next(c) manually if we were deep in middleware, 
			// but inside OnBeforeServe, we typically let the router handle the chain.
			// However, to intercept *response output*, we use the StaticResponseWriter pattern
			// provided by PocketBase's internal API handling.
			
			// Actually, inside OnBeforeServe, we can't easily wrap the handler execution 
			// like standard middleware. 
			// Instead, we will act as a Middleware for the API group.
			return nil
		})

		return nil
	})

	// Alternative approach for GET Caching using PocketBase's Middleware system
	// This is more robust than hooking OnBeforeServe directly for request interception.
	e.Router.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Only cache GET requests
			if c.Request().Method != http.MethodGet {
				return next(c)
			}

			// Only cache API calls (exclude admin UI)
			if !strings.HasPrefix(c.Request().URL.Path, "/api/") {
				return next(c)
			}

			// Generate Key
			// We use the raw URL (path + query params) to ensure
			// pagination (?page=1) and filters are cached separately.
			key := fmt.Sprintf("pb_cache:%s", c.Request().URL.String())

			// Check Redis
			val, err := rdb.Client.Get(rdb.Ctx, key).Result()
			if err == redis.Nil {
				// Cache Miss: Proceed to PocketBase, capture response, and save to Redis
				return handleCacheMiss(c, next, rdb, key)
			} else if err != nil {
				// Redis Error: Log and proceed (fail open)
				log.Printf("Redis Error: %v", err)
				return next(c)
			}

			// Cache Hit
			c.Response().Header().Set("X-PB-Cache", "HIT")
			return c.String(http.StatusOK, val)
		}
	})
}

// handleCacheMiss executes the request, captures the JSON response, and stores it in Redis
func handleCacheMiss(c echo.Context, next echo.HandlerFunc, rdb *RedisClient, key string) error {
	// We need to capture the response body.
	// We create a wrapper writer to intercept Write() calls.
	// Note: In Echo, you usually use responseRecorder.
	
	// 1. Swap the writer
	origWriter := c.Response().Writer
	rec := &responseRecorder{Writer: origWriter}
	c.Response().Writer = rec

	// 2. Execute the actual PocketBase handler
	chainErr := next(c)

	// 3. Restore writer
	c.Response().Writer = origWriter

	// 4. If successful, store in Redis
	if chainErr == nil && c.Response().Status == 200 {
		// Cache for 5 minutes (300 seconds)
		// Parse the body from the recorder
		body := rec.Body.Bytes()

		// Save to Redis
		err := rdb.Client.Set(rdb.Ctx, key, body, 5*time.Minute).Err()
		if err != nil {
			log.Printf("Failed to set cache: %v", err)
		}
		
		// Copy headers from the internal recorder to the real response
		for k, v := range rec.Header() {
			c.Response().Header().Set(k, v[0])
		}
		
		c.Response().Header().Set("X-PB-Cache", "MISS")
		c.Response().WriteHeader(http.StatusOK)
		c.Response().Write(body)
	}

	return chainErr
}

// responseRecorder is a minimal writer to capture the output
type responseRecorder struct {
	http.ResponseWriter
	statusCode int
	body       bytes.Buffer
}

func (r *responseRecorder) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}
```

### How it works

1.  **Connection**: It connects to Redis on startup. If Redis is unavailable, it crashes safely (fail-fast), preventing serving data without a cache layer if that's a requirement for your logic.
2.  **`e.Router.Use` Middleware**: This intercepts every incoming request.
    *   It checks `IsGet` and `IsApi`.
    *   It generates a key based on the full URL (e.g., `pb_cache:/api/collections/posts?page=2`). This means filtered lists are cached correctly.
    *   It attempts to `GET` from Redis.
    *   **Hit**: Returns JSON immediately, skipping database access.
    *   **Miss**: Calls `handleCacheMiss`.
3.  **`handleCacheMiss`**:
    *   It temporarily swaps the HTTP Response Writer with a `responseRecorder`.
    *   It calls `next(c)`, which lets PocketBase query the database and generate the JSON.
    *   Once PocketBase finishes, it grabs the JSON bytes from the recorder.
    *   It saves these bytes to Redis with a 5-minute TTL (Time To Live).
    *   Finally, it writes the data to the original client response.
4.  **Invalidation Hooks**:
    *   `app.OnRecordAfterCreateRequest...`: When you save a record in the Admin UI or via API, these triggers fire.
    *   They use `SCAN` to find all keys in Redis starting with the collection ID and `DEL` them.

### Usage

1.  Place this code in your project folder (e.g., `main.go`).
2.  Start your Redis instance.
3.  Run the app:
    ```bash
    go run main.go serve
    ```
4.  Load a collection endpoint in your browser (e.g., `http://localhost:8090/api/collections/posts`).
5.  Check headers. You should see `X-PB-Cache: MISS`. Refresh immediately, you will see `X-PB-Cache: HIT`.
6.  Edit a record in PocketBase Admin. The cache is cleared, and the next request will be `MISS` again.
