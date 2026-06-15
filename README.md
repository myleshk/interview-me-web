# interview-me-web

[![CI](https://github.com/myleshk/interview-me-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/myleshk/interview-me-web/actions/workflows/deploy.yml)

Recruiter-facing chat frontend for the interview-me project. Built with Next.js 16, Vercel AI SDK v6, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and fill in the values:

```
BACKEND_API_URL=http://localhost:8000/v1
MAX_CODE_USES=5
RATE_LIMIT_VERIFY=5     # optional, defaults shown
RATE_LIMIT_REQUEST=2
RATE_LIMIT_CHAT=20
CF_ACCOUNT_ID=
CF_D1_DATABASE_ID=
CF_API_TOKEN=
```

See `.env.example` for details.

## Design Decisions

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| Internal services unauthenticated (backend, embedding, Qdrant) | Any pod in cluster can reach them | Single-node VPS, no untrusted neighbors; auth adds operational complexity with no security gain |
| Debug endpoint exposed (`/v1/debug/retrieve`) | Returns raw RAG chunks without auth | Cluster-internal only; useful for development debugging |
| Cookie not signed (no server-side session) | Forgeable by setting `interview_me=<any>` manually | Demo project with no sensitive content; per-session UUID enables per-user rate limiting |
| Soft access code limit (no atomic update) | ~1 extra use may slip past `MAX_CODE_USES` under concurrent load | Single-recruiter use; race window negligible in practice |
| In-memory rate limiting (shared `Map`) | Resets on pod restart | Single-pod deployment; no shared-store complexity needed for demo scale |

## Key Files

| File | Purpose |
|------|---------|
| `src/proxy.ts` | Cookie gate on all pages except `/auth` and `/web-api/auth/*` |
| `src/app/auth/page.tsx` | Access code entry + request form |
| `src/app/web-api/auth/verify/route.ts` | Validates code against D1, sets cookie |
| `src/app/web-api/auth/request/route.ts` | Stores access request in D1 |
| `src/app/web-api/chat/route.ts` | Proxies chat to FastAPI backend via AI SDK |
| `src/app/ChatApp.tsx` | Main chat UI (`useChat` + config.json fetch) |
| `src/lib/rate-limit.ts` | In-memory sliding-window rate limiter |
| `src/lib/d1.ts` | Cloudflare D1 REST API client |
| `src/lib/rate-limit.test.ts` | Rate limiter unit tests (vitest) |
| `src/lib/d1.test.ts` | D1 client unit tests (vitest) |
| `public/config.json` | Runtime identity config (overridden by ConfigMap in production) |
| `schema.sql` | D1 database schema |

## Testing

```bash
npm test
```

Runs 20 vitest tests covering rate limiting and D1 client.
