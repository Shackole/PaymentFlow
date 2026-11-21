# ── Stage 1: build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# NEXT_PUBLIC_* vars are inlined at build time — must be available here
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_STELLAR_NETWORK=testnet
ENV NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK

# Next rewrites are compiled during the build. The frontend container proxies
# the lightweight parent portal's same-origin API calls to the backend service.
ARG BACKEND_PROXY_TARGET=http://backend:5000
ENV BACKEND_PROXY_TARGET=$BACKEND_PROXY_TARGET

COPY . .
RUN npm run build

# ── Stage 2: run ──────────────────────────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only what Next.js needs to serve the built app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
