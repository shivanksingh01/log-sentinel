# syntax=docker/dockerfile:1

# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./

# Install production deps only
RUN npm ci --only=production

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Create non-root user for security
RUN addgroup -S sentinel && adduser -S sentinel -G sentinel

WORKDIR /app

# Copy installed node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package.json ./

# Ensure /logs directory exists and is writable by the sentinel user
RUN mkdir -p /logs && chown -R sentinel:sentinel /logs && \
    mkdir -p /app/data && chown -R sentinel:sentinel /app/data

# Switch to non-root user
USER sentinel

# Expose port (matches PORT in .env)
EXPOSE 8080

# Health check — ensures container restarts if server goes unresponsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/v1/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
