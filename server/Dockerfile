FROM node:20-alpine AS builder
WORKDIR /app
COPY prisma ./prisma/
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install
COPY server/ .
RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY prisma ./prisma/
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --only=production
RUN npx prisma generate --schema=../prisma/schema.prisma
COPY --from=builder /app/server/dist ./dist

EXPOSE 5000
CMD ["node", "dist/index.js"]
