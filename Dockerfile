# ── Build Stage ──────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Pass build-time env vars (these become NEXT_PUBLIC_* in the bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_IDENTITY_NAME
ARG NEXT_PUBLIC_IDENTITY_TITLE
ARG NEXT_PUBLIC_IDENTITY_EMPLOYER
ARG NEXT_PUBLIC_IDENTITY_LOCATION
ARG NEXT_PUBLIC_CV_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_IDENTITY_NAME=$NEXT_PUBLIC_IDENTITY_NAME
ENV NEXT_PUBLIC_IDENTITY_TITLE=$NEXT_PUBLIC_IDENTITY_TITLE
ENV NEXT_PUBLIC_IDENTITY_EMPLOYER=$NEXT_PUBLIC_IDENTITY_EMPLOYER
ENV NEXT_PUBLIC_IDENTITY_LOCATION=$NEXT_PUBLIC_IDENTITY_LOCATION
ENV NEXT_PUBLIC_CV_URL=$NEXT_PUBLIC_CV_URL

ENV NODE_ENV=production
RUN npm run build

# ── Runtime Stage ────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
