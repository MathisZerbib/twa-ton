# ── Build Stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (including dev for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Production Stage (Nginx) ──────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner

# Copy the Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
