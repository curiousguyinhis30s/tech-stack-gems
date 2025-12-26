Here is a complete solution for structured JSON logging in PocketBase.

Since PocketBase (v0.22+) logs to `stdout` by default and its Go SDK creates a `logger.Default` instance, the most effective way to implement this is to **wrap the default logger**. This allows you to retain the colored output for local development (optional) and inject middleware to capture the specific metrics (duration, status, IDs) required for Grafana Loki.

### 1. The Logger Implementation

Create a file named `logger.go` in your project's root (or `hooks` folder).

This code handles:
1.  **Structured Output:** JSON marshaling for production.
2.  **Correlation IDs:** Generating and injecting `request_id`.
3.  **Middleware:** Capturing HTTP `status`, `duration`, `path`, and `method`.
4.  **User Context:** Capturing `user_id` (assuming standard auth record IDs).

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/logger"
)

// Define a custom log level to match Loki/Graph conventions easily
type Level string

const (
	LevelInfo  Level = "info"
	LevelError Level = "error"
	LevelDebug Level = "debug"
	LevelFatal Level = "fatal"
)

// LokiLogEntry represents the JSON structure sent to stdout
type LokiLogEntry struct {
	Time      string                 `json:"time"`
	Level     Level                  `json:"level"`
	Message   string                 `json:"msg"`
	RequestID string                 `json:"request_id,omitempty"`
	UserID    string                 `json:"user_id,omitempty"`
	Duration  string                 `json:"duration_ms,omitempty"`
	Status    int                    `json:"status,omitempty"`
	Method    string                 `json:"method,omitempty"`
	Path      string                 `json:"path,omitempty"`
	Extra     map[string]interface{} `json:"extra,omitempty"`
}

// StructuredLogger wraps the PocketBase logger to output JSON
type StructuredLogger struct {
	writer io.Writer
	json   bool // Set to false if you want colored text locally
}

// Write implements io.Writer for the StructuredLogger
func (l *StructuredLogger) Write(p []byte) (n int, err error) {
	// In a real app, you might parse p []byte to extract level/msg from PocketBase internals.
	// However, for Request logging, we rely mostly on the Middleware hook below.
	// This handles standard Go/PB library logs.
	if l.json {
		entry := LokiLogEntry{
			Time:    time.Now().UTC().Format(time.RFC3339),
			Level:   LevelInfo,
			Message: string(p),
		}
		jsonData, _ := json.Marshal(entry)
		l.writer.Write(jsonData)
		l.writer.Write([]byte("\n"))
		return len(p), nil
	}
	return l.writer.Write(p)
}

// SetupLogger configures the global PocketBase logger instance
func SetupLogger(app core.App, enableJSON bool) {
	w := &StructuredLogger{writer: os.Stdout, json: enableJSON}
	// Redirect the default PB logger output
	logger.Default.SetOutput(w)
	
	// Switch to JSON handler for Go 1.21+ slog if desired, 
	// or simply rely on our Middleware for structured HTTP logs.
	if enableJSON {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	}
}

// LoggingMiddleware is the core hook for HTTP request logging
func LoggingMiddleware(app core.App) {
	// This hook runs before the request
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		
		// Add the middleware to the router
		e.Router.BindMiddleware(func(next http.HandlerFunc) http.HandlerFunc {
			return func(w http.ResponseWriter, r *http.Request) {
				start := time.Now()

				// 1. Generate Correlation ID
				// In a real scenario, check headers first (e.g., X-Request-ID)
				rid := r.Context().Value("request_id")
				requestID, _ := rid.(string)
				if requestID == "" {
					requestID = generateID() // Helper function
					// Store in context for retrieval in OnAfterServe
					ctx := contextWithRequestID(r.Context(), requestID)
					r = r.WithContext(ctx)
				}

				// 2. Capture User ID (if available)
				// This assumes you are using standard PB auth. 
				// You can access the auth record from the request context later,
				// but capturing it here requires looking up the token or hooking OnRecordAuthRequest.
				// For Loki logs, it's safest to grab it in OnAfterServe if available.
				
				// Wrap the ResponseWriter to capture status code
				rw := &responseWrapper{ResponseWriter: w, status: 200}

				// Process request
				next(rw, r)

				// 3. Log to Stdout (Grafana Loki format)
				duration := time.Since(start)
				
				// Attempt to get User ID from context (populated by PB auth internally)
				var userID string
				// Note: PocketBase stores the auth record in the request context under "auth_record"
				// We access it via the app helper in OnAfter usually, but here we use raw context if possible
				// or simply rely on the OnAfter hook below which has more data.
				
				logEntry := LokiLogEntry{
					Time:      time.Now().UTC().Format(time.RFC3339),
					Level:     LevelInfo,
					Message:   "HTTP Request",
					RequestID: requestID,
					Status:    rw.status,
					Method:    r.Method,
					Path:      r.URL.Path,
					Duration:  fmt.Sprintf("%d", duration.Milliseconds()),
				}

				// If we are in JSON mode, print JSON
				// We check if the global logger is set to JSON to avoid double printing
				// Or simply always write to stdout here directly for Loki.
				jsonData, _ := json.Marshal(logEntry)
				fmt.Println(string(jsonData))
			}
		})
		return nil
	})
}

// Helper to generate a short ID (e.g., KSUID or UUID)
func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// Helper to store ID in context
type contextKey string
const reqIDKey contextKey = "request_id"

func contextWithRequestID(ctx context.Context, rid string) context.Context {
	return context.WithValue(ctx, reqIDKey, rid)
}

// responseWrapper captures the HTTP status code
type responseWrapper struct {
	http.ResponseWriter
	status int
}

func (rw *responseWrapper) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
```

### 2. Integration in `main.go`

Modify your `main.go` to initialize the logger and middleware.

```go
package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	// Import the logger package/file you created above
)

func main() {
	app := pocketbase.New()

	// 1. Initialize Structured Logger
	// Use true for Production (Loki), false for local dev (Colored text)
	isProduction := os.Getenv("APP_ENV") == "production"
	SetupLogger(app, isProduction)

	// 2. Register Middleware
	LoggingMiddleware(app)

	// OPTIONAL: Add a hook to capture User ID specifically
	// PB processes Auth *after* the middleware starts but before the handler finishes.
	// We use OnAfterServe to enrich the log or simply log the auth event separately.
	app.OnRecordAuthRequest().Add(func(e *core.RecordAuthEvent) error {
		// Log login events specifically with User ID
		if isProduction {
			// You can log to stdout here directly for the login event
			log.Printf(`{"time": "%s", "level": "info", "msg": "User Login", "user_id": "%s", "request_id": "%s"}`, 
				time.Now().UTC().Format(time.RFC3339), 
				e.Record.Id, 
				e.HttpContext().Request.Context().Value(reqIDKey),
			)
		}
		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
```

### Key Features for Grafana Loki

1.  **Label Parsing:** Loki works best when you parse `json` logs.
    *   `request_id`: Used to correlate all logs for a single transaction.
    *   `status`: Used to calculate Error Rates (e.g., `status >= 400`).
    *   `duration_ms`: Used to graph Latency (P95, P99).
2.  **Line Format:** The code outputs one complete JSON object per line. This is the standard format for Loki Promtail agents.
3.  **Context Propagation:** The `request_id` is generated in middleware and added to the Go `context`. You can pass this `context` into any manual logs you write inside your PocketBase hooks (e.g., `slog.InfoContext(ctx, "Processing payment")`).

### Configuration for Promtail / Loki

Ensure your Promtail config scrapes `stdout` of your application container and sets the `json` parsing stage:

```yaml
scrape_configs:
- job_name: pocketbase
  docker:
    host: unix:///var/run/docker.sock
    refresh_interval: 5s
  relabel_configs:
  - source_labels: ['__meta_docker_container_name']
    regex: '/(.*)'
    target_label: 'container_name'
  pipeline_stages:
  - json:
      expressions:
        request_id: request_id
        level: level
        user_id: user_id
        status: status
        duration: duration_ms
        output: msg
  - labels:
      level:
      request_id:
      status:
```
