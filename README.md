# interview-me-web

Recruiter-facing chat frontend for the interview-me project. Built with Next.js 16, Vercel AI SDK v6, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create a `.env` file:

```
BACKEND_API_URL=http://localhost:8000/v1
MAX_CODE_USES=5
CF_ACCOUNT_ID=
CF_D1_DATABASE_ID=
CF_API_TOKEN=
```

See `.env.example` for details.

## Design Decisions

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| Internal services unauthenticated (backend, embedding, Qdrant) | Any pod in cluster can reach them | Single-node VPS, no untrusted neighbors; auth adds operational complexity with no security gain |
| Static cookie (not signed session) | Forgeable by setting `interview_me=1` manually | Demo project with no sensitive content; over-engineering auth adds no value |
| Soft access code limit (no atomic update) | ~1 extra use may slip past `MAX_CODE_USES` under concurrent load | Single-recruiter use; race window negligible in practice |
| In-memory rate limiting (shared `Map`) | Resets on pod restart; per-cookie becomes global bucket with static cookie | Single-pod deployment; no shared-store complexity needed for demo scale |

## Key Files

| File | Purpose |
|------|---------|
| `src/proxy.ts` | Cookie gate on all pages except `/auth` and `/web-api/auth/*` |
| `src/app/auth/page.tsx` | Access code entry + request form |
| `src/app/web-api/auth/verify/route.ts` | Validates code against D1, sets cookie |
| `src/app/web-api/auth/request/route.ts` | Stores access request in D1 |
| `src/app/web-api/chat/route.ts` | Proxies chat to FastAPI backend via AI SDK |
| `src/app/ChatApp.tsx` | Main chat UI (`useChat` + config.json fetch) |
| `src/lib/d1.ts` | Cloudflare D1 REST API client |
| `public/config.json` | Runtime identity config (overridden by ConfigMap in production) |
| `schema.sql` | D1 database schema |
