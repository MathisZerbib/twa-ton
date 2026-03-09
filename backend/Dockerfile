# ── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Prisma Generate ──────────────────────────────────────────────────────────
FROM node:20-alpine AS prisma
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate

# ── Runtime Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy production node_modules (no devDeps)
COPY --from=deps /app/node_modules ./node_modules
# Copy generated Prisma client
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma

# Copy application source
COPY index.js ./
COPY routes ./routes
COPY controllers ./controllers
COPY services ./services
COPY middleware ./middleware
COPY store ./store
COPY prisma ./prisma


EXPOSE 3001

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || npx prisma db push && node index.js"]
