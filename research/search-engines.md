# Self-Hosted Search Engines - 2025 Research

*Generated via GLM parallel research*

## Comparison Table

| Name | Hackability | RAM Usage | Vector Search | Query Speed | Best Use Case |
|:-----|:-----------:|:---------:|:-------------:|:-----------:|:--------------|
| **Typesense** | **7/10** | Medium | Yes (Hybrid) | <50ms | E-commerce, Algolia replacement |
| **Meilisearch** | **6/10** | Low | Limited | <30ms | Content sites, docs, blogs |
| **Zinc** | **9/10** | High | Yes | 100-200ms | ELK replacement, Kubernetes native |
| **Manticore** | **8/10** | Very Low | No | <10ms | High-volume logs, SQL queries |
| **OpenSearch** | **4/10** | Very High | Yes (k-NN) | 200-500ms | Enterprise SIEM, analytics |

---

## Top Recommendations

### 1. Typesense (7/10) - The Algolia Killer

```bash
# Docker deployment
docker run -p 8108:8108 \
  -v /tmp/typesense-data:/data \
  typesense/typesense:27.0 \
  --data-dir /data \
  --api-key=xyz123 \
  --enable-cors
```

**Features:**
- Typo tolerance out of the box
- Hybrid search (keyword + vector)
- S3 compatible
- Instant indexing

**Use Case:** E-commerce product search, documentation sites

### 2. Meilisearch (6/10) - Developer-Friendly

```bash
# Docker deployment
docker run -p 7700:7700 \
  -v /meili_data:/meili_data \
  getmeili/meilisearch:v1.5 \
  meilisearch --master-key=xyz123
```

**Features:**
- Best "default relevance" (feels lucky)
- Rust-based (stable, safe)
- Zero-config typo tolerance
- Incredible speed (<30ms)

**Use Case:** Blog search, marketplace, docs

### 3. Manticore (8/10) - The Speed Demon

```sql
-- Connect via MySQL protocol!
mysql -h127.0.0.1 -P9306

-- Search like SQL
SELECT * FROM products
WHERE MATCH('wireless headphones')
AND price < 100
ORDER BY rating DESC
LIMIT 10;
```

**Features:**
- SQL-native queries
- MySQL/PostgreSQL protocol
- JOINs inside search engine
- Legendary performance (<10ms)

**Use Case:** High-volume logs, backend developers who hate JSON

---

## Vector Search Comparison

| Engine | Vector Support | Method | Hybrid Search |
|--------|:--------------:|:------:|:-------------:|
| Typesense | ✅ Yes | Built-in | ✅ Yes |
| Meilisearch | ⚠️ Experimental | Limited | ❌ No |
| Zinc | ✅ Yes | Embeddings | ⚠️ Basic |
| OpenSearch | ✅ Yes | k-NN | ✅ Yes |
| Manticore | ❌ No | N/A | N/A |

---

## Our Stack Recommendation

```yaml
# docker-compose.yml - Search stack
version: '3.8'

services:
  typesense:
    image: typesense/typesense:27.0
    ports:
      - "8108:8108"
    volumes:
      - typesense_data:/data
    command: >
      --data-dir /data
      --api-key=${TYPESENSE_API_KEY}
      --enable-cors
    environment:
      - TYPESENSE_API_KEY=${TYPESENSE_API_KEY}

  meilisearch:
    image: getmeili/meilisearch:v1.5
    ports:
      - "7700:7700"
    volumes:
      - meili_data:/meili_data
    environment:
      - MEILI_MASTER_KEY=${MEILI_MASTER_KEY}

volumes:
  typesense_data:
  meili_data:
```

---

## Quick Integration

### Typesense with JavaScript

```typescript
import Typesense from 'typesense'

const client = new Typesense.Client({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: 'xyz123',
})

// Create collection
await client.collections().create({
  name: 'products',
  fields: [
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'price', type: 'float' },
    { name: 'embedding', type: 'float[]', num_dim: 384 }, // Vector!
  ],
})

// Search with hybrid (keyword + vector)
const results = await client.collections('products').documents().search({
  q: 'wireless earbuds',
  query_by: 'name,description',
  vector_query: 'embedding:([], k:10)', // Semantic
})
```

---

## Final Verdict

| Need | Best Choice |
|------|-------------|
| Algolia replacement | **Typesense** |
| Content/docs search | **Meilisearch** |
| SQL-based queries | **Manticore** |
| Vector/semantic search | **Typesense** or **OpenSearch** |
| ELK replacement | **Zinc** |
