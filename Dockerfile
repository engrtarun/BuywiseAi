# ============================================================================
# BuyWise AI — Production Dockerfile
# ============================================================================
# Multi-stage build implementing 3 Core Layers:
#   Layer A: Smart Dependency Layering (cache npm ci)
#   Layer B: Standalone Isolation (strip dev deps + node_modules)
#   Layer C: Non-Root Security Guardrail (nextjs user)
# ============================================================================

# ── BASE ─────────────────────────────────────────────────────────────────────
# Pin the exact Alpine LTS image for reproducibility across CI and prod.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app


# ── LAYER A: DEPENDENCIES ───────────────────────────────────────────────────
# Copy ONLY package manifests first.  Docker caches this layer as long as
# package.json + package-lock.json remain unchanged, skipping npm ci on every
# code change.  This saves ~90% of rebuild time.
FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts


# ── LAYER B: BUILD ──────────────────────────────────────────────────────────
# Build the production Next.js bundle with standalone output enabled.
# Client-side NEXT_PUBLIC_* vars are inlined into the JS at build time,
# so they must be present here as ARGs.
FROM base AS builder

WORKDIR /app

# Bring in the dependency tree from Layer A
COPY --from=deps /app/node_modules ./node_modules

# Copy entire source tree
COPY . .

# ── Build-time environment variables (client-side, embedded into JS) ────
# These are NOT secrets; they are public Supabase identifiers.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ── LAYER C: RUNNER (Production) ────────────────────────────────────────────
# Minimal runtime image.  No devDependencies, no build cache, no source code.
FROM base AS runner

WORKDIR /app

# Production indicator
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ── Non-Root Security Guardrail ─────────────────────────────────────────
# Create a limited-privilege system user "nextjs" so that even if the app
# is compromised, the attacker cannot escalate to root on the host.
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# ── Standalone artefacts ────────────────────────────────────────────────
# Next.js standalone output gives us a self-contained server.js plus only
# the exact node_modules files it needs.  The full node_modules tree and
# all dev tooling are left behind in the builder stage.
COPY --from=builder /app/public                    ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone  ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static      ./.next/static

# Switch execution to the locked-down user
USER nextjs

# Expose the default Next.js port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the standalone server
CMD ["node", "server.js"]
