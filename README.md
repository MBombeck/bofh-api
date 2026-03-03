<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="public/logo.png">
    <img src="public/logo.png" width="120" height="120" alt="BOFH Excuses API">
  </picture>
</p>

<h3 align="center">BOFH Excuses API</h3>

<p align="center">
  453 classic BOFH excuses as a free JSON API. No auth. No nonsense.<br>
  <a href="https://bofh.bombeck.io"><strong>bofh.bombeck.io</strong></a> · <a href="https://bofh.bombeck.io/openapi.json">OpenAPI Spec</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/version-3.0.0-blue.svg" alt="Version 3.0.0">
  <a href="https://monitor.bombeck.io/status/services"><img src="https://img.shields.io/badge/status-operational-brightgreen.svg" alt="API Status"></a>
</p>

---

## Quick Start

```bash
# JSON (default)
curl https://bofh.bombeck.io/v1/excuses/random

# Plain text — just the excuse
curl -H "Accept: text/plain" https://bofh.bombeck.io/v1/excuses/random
```

```json
{
  "data": { "id": 42, "excuse": "Solar flares" },
  "meta": { "total": 453 },
  "error": null
}
```

### JavaScript

```javascript
const res = await fetch("https://bofh.bombeck.io/v1/excuses/random");
const { data } = await res.json();
console.log(data.excuse);
```

### Python

```python
import requests
r = requests.get("https://bofh.bombeck.io/v1/excuses/random")
print(r.json()["data"]["excuse"])
```

### Go

```go
resp, _ := http.Get("https://bofh.bombeck.io/v1/excuses/random")
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)
fmt.Println(string(body))
```

### Shell one-liner

```bash
echo "Excuse: $(curl -sH 'Accept: text/plain' https://bofh.bombeck.io/v1/excuses/random)"
```

---

## API Reference

**Base URL:** `https://bofh.bombeck.io`
**OpenAPI:** [`/openapi.json`](https://bofh.bombeck.io/openapi.json)

All responses follow the envelope `{ data, meta, error }`.
Set `Accept: text/plain` on any excuse endpoint to get raw text instead of JSON.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/excuses/random` | One random excuse |
| `GET` | `/v1/excuses/random?count=N` | N random excuses (1–50) |
| `GET` | `/v1/excuses/:id` | Excuse by ID (1–453) |
| `GET` | `/v1/excuses` | All 453 excuses |
| `GET` | `/health` | Health check |
| `GET` | `/openapi.json` | OpenAPI 3.1 specification |

### Response Examples

**Single excuse** — `GET /v1/excuses/random`

```json
{
  "data": { "id": 42, "excuse": "Solar flares" },
  "meta": { "total": 453 },
  "error": null
}
```

**Multiple excuses** — `GET /v1/excuses/random?count=3`

```json
{
  "data": [
    { "id": 112, "excuse": "clock speed" },
    { "id": 7, "excuse": "Cosmic rays" },
    { "id": 301, "excuse": "Failure to adjust for stripes" }
  ],
  "meta": { "count": 3, "total": 453 },
  "error": null
}
```

**Plain text** — `curl -H "Accept: text/plain" .../v1/excuses/random`

```
Solar flares
```

### Errors

```json
{
  "data": null,
  "meta": null,
  "error": { "code": "NOT_FOUND", "message": "excuse #999 not found" }
}
```

| Status | Code | Meaning |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid parameters |
| 404 | `NOT_FOUND` | Excuse or route not found |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

### Rate Limiting

- **1,000 requests** per 15 minutes per IP
- Standard `RateLimit-*` headers in all responses
- `/health` is excluded from rate limiting

---

## Self-Hosting

### Docker

```bash
docker run -d -p 3000:3000 -e ATTACKS_API_KEY=your-secret ghcr.io/mbombeck/bofh:latest
```

### From Source

```bash
git clone https://github.com/MBombeck/bofh.git
cd bofh
npm ci && npm run build
ATTACKS_API_KEY=your-secret npm start
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `production` | Environment |
| `ATTACKS_API_KEY` | Yes | — | Key for internal `/internal/attacks` endpoint |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins (comma-separated) |
| `LANDING_HOST` | No | `bofh.bombeck.io` | Hostname for the landing page |
| `SENTRY_DSN` | No | — | Sentry/GlitchTip DSN |
| `LOG_LEVEL` | No | `info` | `debug` / `info` / `warn` / `error` |

---

## What is BOFH?

The **Bastard Operator From Hell** is a fictional rogue sysadmin created by [Simon Travaglia](https://en.wikipedia.org/wiki/Bastard_Operator_From_Hell) in 1992. The original excuse list of 453 entries was compiled by Jeff Ballard.

## Credits

- **Simon Travaglia** — Creator of the Bastard Operator From Hell
- **Jeff Ballard** — Original BOFH excuse list compiler
- Built by [Marc Bombeck](https://bombeck.io)

## License

[MIT](LICENSE)
