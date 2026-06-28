# syntax=docker/dockerfile:1
ARG APP

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS pruner
ARG APP
RUN npm i -g turbo@^2
COPY . .
RUN turbo prune "@test/${APP}" --docker

FROM base AS builder
ARG APP
COPY --from=pruner /app/out/json/ .
RUN yarn install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY tsconfig.base.json .
RUN yarn turbo build --filter="@test/${APP}"

FROM base AS runner
ARG APP
ENV NODE_ENV=production APP=${APP}
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/apps/${APP}/.next/standalone ./
COPY --from=builder /app/apps/${APP}/.next/static  ./apps/${APP}/.next/static
COPY --from=builder /app/apps/${APP}/public         ./apps/${APP}/public
COPY --from=builder /app/apps/${APP}/entrypoint.sh  ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["./entrypoint.sh"]
