FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Generate prisma client and build typescript
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Copy production dependencies and built files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Add a script to run migrations and start the server
COPY <<-"EOF" /app/entrypoint.sh
#!/bin/sh
set -e
echo "Deploying database migrations..."
npx prisma migrate deploy
echo "Starting application..."
npm start
EOF

RUN chmod +x /app/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
