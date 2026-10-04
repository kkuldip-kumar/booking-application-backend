# ================================
# 🌱 Stage 1: Build
# ================================
FROM node:22-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml .npmrc ./

# This env var tells pnpm to ignore the build approval gate entirely
ENV PNPM_IGNORE_SCRIPTS=false
RUN pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true


# Copy source code
COPY . .

# ✅ Include fonts for Puppeteer PDF rendering
COPY public/fonts /app/public/fonts

# Build TypeScript app
RUN pnpm run build


# ================================
# 🚀 Stage 2: Runtime
# ================================
FROM node:22-slim

WORKDIR /app

# Install pnpm and Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    dumb-init \
    chromium \
    ca-certificates \
    fonts-freefont-ttf \
    fonts-wqy-zenhei \
    fonts-noto-color-emoji \
    libfreetype6 \
    libharfbuzz0b \
    && rm -rf /var/lib/apt/lists/*

    # ✅ Install pnpm before using it
RUN npm install -g pnpm
# Puppeteer config
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=development

# Copy dependency manifests
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true && pnpm store prune

# Copy built code and assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/public ./public
# COPY --from=builder /app/config ./config
# Create folders for persistent data
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nestjs && \
    mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R nestjs:nodejs /app/logs /app/uploads /app/temp
    
USER nestjs

COPY .env .env
# Expose NestJS port
EXPOSE 4000

# Start via dumb-init
ENTRYPOINT ["dumb-init", "--"]

# CMD ["node", "dist/main"]
CMD ["node", "dist/src/main.js"]