Here is a complete solution to implement semantic search in PocketBase using the `sqlite-vec` extension.

### Prerequisites

1.  **PocketBase Instance:** A running PocketBase instance (v0.22+ recommended).
2.  **OpenAI API Key:** You need a key to generate embeddings.
3.  **Loadable Extension Support:** PocketBase must be able to load SQLite extensions. If you are using the pre-built binaries, this is supported. If you are compiling from source, ensure you build with the `sqlite_load_extension` tag (enabled by default in standard releases).
4.  **sqlite-vec:** Download the specific extension file for your OS (e.g., `vec0`) from [sqlite-vec releases](https://github.com/asg017/sqlite-vec/releases).

### Step 1: Setup Database & Extension

First, ensure you have the `vec0` extension file in the same directory as your PocketBase executable (or in a known path).

Start your PocketBase instance. Open the **Admin Dashboard** (usually `http://127.0.0.1:8090/_/`) to initialize the database, but we will run the schema setup commands via the API or a migration script to ensure the vector extension is loaded correctly.

You can run this SQL setup in the PocketBase \
