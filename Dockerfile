# ── Build Stage ──────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build

# ── Runtime Stage ────────────────────────────────────────
FROM node:24-slim AS runner

WORKDIR /app

RUN groupadd --system appgroup && useradd --system --no-create-home --gid appgroup appuser

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
