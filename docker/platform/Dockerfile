FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/create-cimmy-skill/package.json packages/create-cimmy-skill/
COPY apps/platform/package.json apps/platform/
RUN pnpm install --frozen-lockfile=false
COPY packages/shared packages/shared
COPY packages/create-cimmy-skill packages/create-cimmy-skill
COPY apps/platform apps/platform
RUN pnpm --filter @cimmy/shared build \
  && pnpm --filter @cimmy/create-skill build \
  && pnpm --filter @cimmy/platform build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app /app
RUN mkdir -p /data/artifacts
ENV CIMMY_ARTIFACTS_DIR=/data/artifacts
WORKDIR /app/apps/platform
EXPOSE 3000
CMD ["node", "dist/index.js"]
