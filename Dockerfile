FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build needs no runtime env vars — the DB client (src/db/index.ts) is
# lazy and `getServerEnv()` isn't called by the prerendered pages. All
# secrets live in Dokploy's runtime Environment tab.
RUN pnpm build

FROM node:24-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# TanStack Start builds to ./dist (server.js + client/).
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "scripts/start-server.mjs"]
