Here is the complete, production-ready Go code for a PocketBase hook.

### Prerequisites

To use this code, you must initialize your PocketBase project for Go hooks (via `pocketbase serve` or by creating a custom `main.go`). Ensure you have the necessary extensions folder structure set up, as this code resides in the `hooks` directory.

### 1. Configuration

You should store your Medusa API URL and secret in your PocketBase configuration file (`pb_data/data.db` via the admin UI or environment variables).

Assuming you use environment variables (recommended for Docker/Production):
*   `MEDUSA_BACKEND_URL`: e.g., `http://localhost:9000`
*   `MEDUSA_API_TOKEN`: Your Medusa Admin API Token (generated via `medusa user -g` or similar)

### 2. The Hook Code (`hooks/medusa_sync.go`)

Create a file named `medusa_sync.go` inside the `hooks` folder of your PocketBase project.

```go
package hooks

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
)

// MedusaCustomer represents the response structure from Medusa
type MedusaCustomer struct {
	Customer struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	} `json:"customer"`
}

// MedusaError represents the error response from Medusa
type MedusaError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Code    string `json:"code"`
}

// RegisterHooks registers all custom hooks for the application
func RegisterHooks(app *pocketbase.PocketBase) {
	
	// Register the hook to trigger after a successful OAuth2 login
	app.OnRecordAfterAuthWithOAuth2Success().Add(func(e *core.RecordAuthWithOAuth2Event) error {
		record := e.Record
		
		// 1. Basic Validation
		// Ensure the record is a user (usually 'users' collection) and has an email
		if record.Collection().Name != "users" {
			return nil // Not a user, skip
		}

		email := record.Email()
		if email == "" {
			log.Println("[MedusaSync] Skipping sync: User has no email.")
			return nil
		}

		// 2. Configuration
		medusaURL := os.Getenv("MEDUSA_BACKEND_URL")
		medusaToken := os.Getenv("MEDUSA_API_TOKEN")

		// Fallback for local testing if env vars aren't set (optional, but good for safety)
		if medusaURL == "" {
			// You could log this or return an error depending on strictness
			log.Println("[MedusaSync] MEDUSA_BACKEND_URL not set, skipping sync.")
			return nil
		}

		// 3. Check if we already synced this user
		// We look for a field 'medusaCustomerId' in the PocketBase user record
		medusaId, ok := record.GetDataValue("medusaCustomerId").(string)

		if ok && medusaId != "" {
			log.Printf("[MedusaSync] User %s already has Medusa ID: %s. Skipping create/update.", email, medusaId)
			return nil
		}

		// 4. Prepare Payload
		// We extract first/last name. Authentik usually sends these in the profile
		firstName, _ := record.GetDataValue("name").(string)
		// Or however you mapped the claims in PocketBase OAuth settings
		// For example, if you mapped given_name to 'firstName' field:
		if fn, ok := record.GetDataValue("firstName").(string); ok {
			firstName = fn
		}
		
		lastName, _ := record.GetDataValue("lastName").(string)

		payload := map[string]interface{}{
			"email":       email,
			"first_name":  firstName,
			"last_name":   lastName,
			"metadata":    map[string]string{"provider": "authentik"}, // Optional metadata
		}

		jsonPayload, err := json.Marshal(payload)
		if err != nil {
			log.Printf("[MedusaSync] Failed to marshal payload: %v", err)
			// We return nil here because we don't want to block the login process 
			// just because the sync failed.
			return nil 
		}

		// 5. Create Customer in Medusa
		// Endpoint: POST /store/customers (or /admin/customers depending on your setup)
		// Using standard Store API token usually requires admin token to attach customer easily 
		// without going through the flow, but here we use the generic admin API endpoint 
		// usually found at /admin/customers if using a service role token.
		apiEndpoint := medusaURL + "/admin/customers"

		req, err := http.NewRequest("POST", apiEndpoint, bytes.NewBuffer(jsonPayload))
		if err != nil {
			log.Printf("[MedusaSync] Failed to create request: %v", err)
			return nil
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+medusaToken)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[MedusaSync] Failed to send request to Medusa: %v", err)
			return nil
		}
		defer resp.Body.Close()

		// 6. Handle Response
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			var medusaResp MedusaCustomer
			if err := json.NewDecoder(resp.Body).Decode(&medusaResp); err != nil {
				log.Printf("[MedusaSync] Failed to decode Medusa response: %v", err)
				return nil
			}

			customerID := medusaResp.Customer.ID

			// 7. Update PocketBase Record
			// Save the Medusa Customer ID back to PocketBase
			// We use SetDataValue to update the in-memory record, then Save()
			record.SetDataValue("medusaCustomerId", customerID)
			
			if err := app.Save(record); err != nil {
				log.Printf("[MedusaSync] Failed to update PocketBase user with Medusa ID: %v", err)
			} else {
				log.Printf("[MedusaSync] Successfully synced user %s to Medusa ID %s", email, customerID)
			}

		} else {
			// Handle Medusa API Error (e.g., User already exists in Medusa)
			var medusaErr MedusaError
			json.NewDecoder(resp.Body).Decode(&medusaErr)
			
			log.Printf("[MedusaSync] Medusa API Error %d: %s - %s", resp.StatusCode, medusaErr.Type, medusaErr.Message)
			
			// Note: If the user already exists in Medusa (duplicate email), Medusa returns 400/409.
			// You might want to implement logic here to GET the customer by email and retrieve the ID,
			// then update PB accordingly. For this snippet, we log it.
		}

		// Important: Return nil so we don't stop the authentication flow in PocketBase
		return nil
	})
}
```

### 3. Integration (`main.go`)

You need to call this `RegisterHooks` function in your `main.go`. If you are just using standard PocketBase, you can create a `main.go` file in the root of your project.

```go
package main

import (
	"log"

	// Import your hooks package
	"github.com/your-username/your-pb-project/hooks"
	"github.com/pocketbase/pocketbase"
)

func main() {
	app := pocketbase.New()

	// Register custom hooks
	hooks.RegisterHooks(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
```

### 4. Database Setup

Before running this, ensure your `users` collection in PocketBase has a field to store the ID:
1.  Go to Settings > Collections > Users.
2.  Create a new field named `medusaCustomerId`.
3.  Type: Text.
4.  (Optional) Make it unique if you plan to query by it often.

### Key Implementation Details

1.  **Event Trigger (`OnRecordAfterAuthWithOAuth2Success`)**: This triggers immediately after a user successfully logs in via Authentik (Google/GitHub/etc).
2.  **Idempotency**: The code checks `if ok && medusaId != ""`. This prevents hitting the Medusa API every time the user logs in, once they are synced.
3.  **Data Mapping**:
    *   It tries to grab `firstName` and `lastName` from the record data. Ensure your Authentik mapper in PocketBase sends the correct claims (e.g., `given_name` -> `firstName`).
    *   Alternatively, you can rely on the raw data provided by `e.OAuth2User` (passed in the event) if you don't want to store names in PB, but typically syncing the PB record to Medusa is cleaner.
4.  **Error Handling**:
    *   The function **always returns `nil`**. This is critical. If the Medusa API is down (returns 500), we do *not* want to prevent the user from logging into PocketBase. We simply log the error and skip the sync.
    *   It uses the Medusa **Admin API** (`/admin/customers`) because creating a customer via the Store API usually requires a cookie session (JWT), which we don't have in a backend hook. An Admin API token (Bearer token) is used here.
