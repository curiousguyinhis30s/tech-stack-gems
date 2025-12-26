Here is a complete, robust bash script to test your Medusa.js setup.

This script assumes you have a standard Medusa setup (likely using the official `medusa-js` starter or a docker-compose setup that includes the Backend, Postgres, Redis, and a Stripe Tunnel).

### The Test Script (`test_medusa.sh`)

Save this into your project root (same level as your `docker-compose.yml`).

```bash
#!/bin/bash

# ==========================================
# CONFIGURATION
# ==========================================
MEDUSA_BACKEND_URL="${MEDUSA_BACKEND_URL:-http://localhost:9000}"
STORE_URL="${STORE_URL:-http://localhost:3000}"
MAX_RETRIES=30
RETRY_INTERVAL=2
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ==========================================
# 1. START ENVIRONMENT
# ==========================================
log_info "Step 1: Starting Docker environment..."
docker-compose up -d

if [ $? -ne 0 ]; then
    log_error "Failed to start docker containers."
    exit 1
fi

# ==========================================
# 2. HEALTH CHECK
# ==========================================
log_info "Step 2: Waiting for Medusa Backend to be healthy..."

health_check_url="${MEDUSA_BACKEND_URL}/health"
is_healthy=false

for ((i=1; i<=MAX_RETRIES; i++)); do
    # We use curl with -s (silent) and get the HTTP code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$health_check_url")
    
    if [ "$status_code" -eq 200 ]; then
        log_info "Medusa is up and healthy!"
        is_healthy=true
        break
    else
        echo -n "."
        sleep $RETRY_INTERVAL
    fi
done

echo ""

if [ "$is_healthy" = false ]; then
    log_error "Medusa failed to start after $((MAX_RETRIES * RETRY_INTERVAL)) seconds."
    docker-compose logs --tail=50
    exit 1
fi

# ==========================================
# 3. TEST API ENDPOINTS
# ==========================================
log_info "Step 3: Testing Core API Endpoints..."

# --- A. List Products ---
log_info "  -> Testing GET /store/products"
products_response=$(curl -s -X GET "${MEDUSA_BACKEND_URL}/store/products" \
    -H "Content-Type: application/json")

if echo "$products_response" | grep -q "products"; then
    log_info "      ✓ Products list fetched successfully."
else
    log_error "      ✗ Failed to fetch products."
    echo "$products_response"
fi

# --- B. Create Cart ---
log_info "  -> Testing POST /store/carts (Create Cart)"
cart_response=$(curl -s -X POST "${MEDUSA_BACKEND_URL}/store/carts" \
    -H "Content-Type: application/json")

cart_id=$(echo "$cart_response" | grep -o '"id":"[^"]*"' | head -n 1 | cut -d'"' -f4)

if [ -n "$cart_id" ]; then
    log_info "      ✓ Cart created. ID: $cart_id"
else
    log_error "      ✗ Failed to create cart."
    echo "$cart_response"
fi

# --- C. Add Item to Cart ---
# Note: We need a variant ID to add an item. This tries to grab one from the products list.
# If you have a fresh DB, there may be no products. Seeding is recommended first.
log_info "  -> Testing POST /store/carts/${cart_id}/line-items (Add Item)"

# Attempt to extract a variant ID from the previous product list
variant_id=$(echo "$products_response" | grep -o '"id":"variant_[^"]*"' | head -n 1 | cut -d'"' -f4)

if [ -n "$variant_id" ] && [ "$variant_id" != "null" ]; then
    add_item_response=$(curl -s -X POST "${MEDUSA_BACKEND_URL}/store/carts/${cart_id}/line-items" \
        -H "Content-Type: application/json" \
        -d "{\"quantity\":1,\"variant_id\":\"${variant_id}\"}")
    
    if echo "$add_item_response" | grep -q "$cart_id"; then
        log_info "      ✓ Item added to cart."
    else
        log_warn "      ⚠ Could not add item (Product might be out of stock or variant ID invalid)."
    fi
else
    log_warn "      ⚠ Skipped adding item. No product variant found in DB. (Did you run 'medusa seed'?)"
fi

# ==========================================
# 4. VERIFY STRIPE WEBHOOK
# ==========================================
log_info "Step 4: Verifying Stripe Webhook Tunnel..."

# We check the /health endpoint again, which often reports if the payment provider (Stripe) 
# is initialized, but specifically we want to check if the CLI tunnel is active.
# Medusa doesn't have a native "is stripe listening" endpoint, so we check generic health 
# or assume if the container 'stripe-cli' is up, it's good.

if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    log_info "  ✓ STRIPE_WEBHOOK_SECRET is set."
else
    log_warn "  ⚠ STRIPE_WEBHOOK_SECRET is not set. Checkout might fail if webhooks are required."
fi

# Check if the stripe-cli container (common in setups) is running
stripe_status=$(docker-compose ps stripe-cli 2>/dev/null | grep "Up")
if [ -n "$stripe_status" ]; then
    log_info "  ✓ Stripe CLI container appears to be running."
else
    log_warn "  ⚠ Stripe CLI container not detected. Webhooks will not be forwarded to localhost."
fi

# ==========================================
# CLEANUP & FINISH
# ==========================================
log_info "Test Suite Complete!"
log_info "Backend URL: ${MEDUSA_BACKEND_URL}"
log_info "To view logs run: docker-compose logs -f"
```

### How to use it

1.  **Save the file:** Save the script above as `test_medusa.sh` in your project root.
2.  **Make it executable:**
    ```bash
    chmod +x test_medusa.sh
    ```
3.  **Run it:**
    ```bash
    ./test_medusa.sh
    ```

### Prerequisites & Tips

1.  **Seeding Data:**
    The script tries to add a product to the cart. If your database is empty, the "Add Item" step will report a warning because it cannot find a `variant_id`.
    To fix this, ensure you seed your database before running the script, or inside the script before `docker-compose up`:
    *Example:* `docker-compose exec -T medusa npm run seed` (if your service is named `medusa`).

2.  **Stripe Tunnel:**
    Most Medusa docker-compose setups include a `stripe-cli` service. This service forwards webhooks from Stripe to your local `localhost`.
    *   The script checks if this container is running.
    *   For the "Verify Stripe Webhook" step to pass 100%, you need your `STRIPE_WEBHOOK_SECRET` environment variable loaded in your shell or `.env` file.

3.  **Storefront (Next.js):**
    If you also want to check if your Next.js storefront is up, you can add this to the **Health Check** loop:
    ```bash
    store_status=$(curl -s -o /dev/null -w "%{http_code}" "$STORE_URL")
    ```
