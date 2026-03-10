# ------------------------------------------------------------
#  Multi-stage build – keep the final image tiny
# ------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev   # install only production deps
COPY . .

# ------------------------------------------------------------
#  Runtime image
# ------------------------------------------------------------
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "api/index.js"]