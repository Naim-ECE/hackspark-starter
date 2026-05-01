# Backend Completion Plan (UI-Compatible)

Status baseline (already implemented)
- P1/P4: /status on all services + api-gateway aggregate, multistage Dockerfiles + healthchecks, .dockerignore
- P2: user-service register/login/me with bcrypt + JWT + Postgres table
- P3/P5: rental-service products proxy + category validation + cache + 429 backoff
- P11/P13/P14: analytics-service peak-window, surge-days, recommendations + cache + 429 backoff

Frontend contract (from mocks.js + api.js)
- Products list: { data: [ { id, name, pricePerDay, category, description?, image? } ], page, limit, total, totalPages }
- Product detail: { id, name, pricePerDay, category, description?, image? }
- Availability: { productId, available, busyPeriods: [ { start, end } ], freeWindows: [ { start, end } ] }
- Recommendations: { recommendations: [ { productId, name, category, score, image?, pricePerDay? } ] }
- Surge: { data: [ { date, count, nextSurgeDate?, daysUntil? } ] }
- Discount: { discountPercent, securityScore }
- Top categories: { categories: [ string ] }
- Chat sessions: { sessions: [ { id, title } ] }
- Chat history: { messages: [ { role, text } ] }
- Chat reply: { reply: { role, text } }

Plan overview (complete backend to match UI)

1) API Gateway: single public surface for UI
- Implement CORS for http://localhost:3000
  - Allow Authorization header, allow OPTIONS preflight
  - Expose JSON errors with { message }
- Add proxy routes to internal services, preserving query params and Authorization header
  - /users/* -> user-service
  - /rentals/* -> rental-service
  - /analytics/* -> analytics-service
  - /chat* -> agentic-service
- Add response normalizers where UI needs shape mapping
  - Products list: map Central API fields to { data, page, limit, total, totalPages }
    - name <- name/title, pricePerDay <- price/pricePerDay
  - Product detail: map to { id, name, pricePerDay, category, description, image }
  - Recommendations: rename items -> recommendations if needed
  - Surge days: ensure { data: [...] } is returned
  - Chat: ensure { reply: { role, text } }
  - Ensure errors return { message } and correct HTTP status
- Keep /status aggregate as-is (already done)

2) user-service: complete UI-required endpoints
- Add Central API wrapper with cache + axios-retry (429 backoff)
- Implement GET /users/:id/discount
  - Fetch /api/data/users/:id
  - Compute tier:
    - 80-100 -> 20
    - 60-79 -> 15
    - 40-59 -> 10
    - 20-39 -> 5
    - 0-19 -> 0
  - Return { discountPercent, securityScore }
- Confirm /users/me returns { id, email, name } (securityScore optional unless UI needs it)

3) rental-service: complete UI-required endpoints
- Implement GET /rentals/products/:id/availability
  - Fetch all rentals for product (paginated) from Central API
  - Merge overlapping intervals (sort by start; linear scan)
  - Compute busyPeriods and freeWindows within query range
  - Return { productId, available, busyPeriods, freeWindows }
- Implement GET /rentals/users/:id/top-categories
  - Fetch all rentals for renter_id (paginated)
  - Batch fetch products by ID (<=50 per request)
  - Count categories, return top K if provided (min-heap)
  - Response: { categories: [string] }
- (Optional for UI later) Implement P12 merged-feed if required by UI

4) analytics-service: add missing UI endpoint
- Implement /analytics/trending
  - Define behavior: use recommendations with today date or stats-based top categories
  - Return list of items the UI expects (coordinate with frontend if needed)
- Ensure /analytics/recommendations returns { recommendations: [...] }
- Ensure /analytics/surge-days returns { data: [...] }

5) agentic-service: chat endpoints (P15/P16)
- Add topic guard (RentPi keywords) before LLM call
- Add data grounding calls (analytics-service/rental-service) where relevant
- Implement MongoDB session + message storage
- Endpoints:
  - GET /chat/sessions -> { sessions: [ { id, title } ] }
  - GET /chat/:sessionId/history -> { messages: [ { role, text } ] }
  - POST /chat -> { reply: { role, text } }
- Ensure response shapes match UI exactly

6) Error handling + security
- Central API wrapper in each service should:
  - Cache (TTL ~55s)
  - axios-retry on 429 with exponential backoff + jitter
  - Return 503 after 3 retries with { error, lastRetryAfter, suggestion }
- Ensure JWT usage is consistent with JWT_SECRET
- Keep all secrets in env only

Dependencies to add (per service)
- api-gateway: axios, cors (if not present)
- user-service: axios, axios-retry, node-cache (Central API wrapper)
- rental-service: already has axios, axios-retry, node-cache
- analytics-service: already has axios, axios-retry, node-cache, dayjs
- agentic-service: axios, mongoose (or mongo driver), LLM SDK

Milestone order (recommended)
1. API gateway proxy + CORS + response mapping
2. user-service discount endpoint
3. rental-service availability + top-categories
4. analytics-service trending endpoint + shape alignment
5. agentic-service chat endpoints
6. Final QA: verify shapes and error codes
