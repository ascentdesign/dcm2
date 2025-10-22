# syntax=docker/dockerfile:1

# --- Build stage: install deps and build Vite ---
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
# Install deps first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
# Copy source and build
COPY . .
RUN npm run build -- --minify false

# --- Runtime stage: serve static assets from dist ---
FROM node:20-alpine AS runner
WORKDIR /app
# Install a lightweight static file server
RUN npm i -g serve@14.2.1
ENV NODE_OPTIONS=--max_old_space_size=512
ENV PORT=8080
EXPOSE 8080
# Only copy built assets
COPY --from=builder /app/dist ./dist
# Bind to 0.0.0.0 for container networking
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:8080"]