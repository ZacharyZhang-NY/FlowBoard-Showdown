FROM node:20-alpine

ARG APP_DIR

# better-sqlite3 needs native build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies
COPY ${APP_DIR}/package.json ${APP_DIR}/package-lock.json* ./
RUN npm ci

# Copy app source
COPY ${APP_DIR}/ .

# Copy shared entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Default env vars for build
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NODE_ENV=production

# Build Next.js directly (skip project-specific dev setup scripts)
RUN npx next build

EXPOSE 3000

CMD ["/docker-entrypoint.sh"]
