

Here is a complete, working PocketBase plugin that implements a FaaS (Function as a Service) system.

This solution includes:
1.  **Go Plugin Logic**: Hooks into PocketBase bootstrap, initializes the VM, and captures changes.
2.  **Hot Reload**: Listens to database writes. If you update the script in the Admin UI, the Goja VM recompiles it immediately without restarting the server.
3.  **API Endpoint**: Exposes `/api/faas/:name` to run functions via POST request.
4.  **Context Injection**: Passes the PocketBase `App` instance and request arguments into the JavaScript environment.

### Prerequisites

1.  Initialize a new PocketBase project:
    ```bash
    mkdir pb-faas
    cd pb-faas
    go get github.com/pocketbase/pocketbase
    ```
2.  Create a file named `faas.go` and paste the code below.
3.  Create a file named `imports.go` (required to include the Goja dependency).

### 1. The Plugin Code (`faas.go`)

```go
package main

import (
	\
.go`. This file contains the extension that hooks into PocketBase's lifecycle.

```go
package main

import (
	\
