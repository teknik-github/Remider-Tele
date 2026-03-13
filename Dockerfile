# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install build deps needed by better-sqlite3 (native addon)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Runtime dep for better-sqlite3 native module
RUN apk add --no-cache libstdc++

# Copy only the Nitro output (self-contained server bundle)
COPY --from=builder /app/.output ./.output

# Persistent volume for the SQLite database
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
