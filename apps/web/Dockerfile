# 1. Base image
FROM node:20-alpine AS base
WORKDIR /app

# 2. Installer stage: Install dependencies
FROM base AS installer
# Copy root package manager files and turbo config
COPY package.json package-lock.json* turbo.json ./
# Copy package.json for all workspaces
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Force a clean install
RUN rm -rf node_modules package-lock.json

# Install all dependencies
RUN npm install

# 3. Builder stage: Build the application
FROM base AS builder
WORKDIR /app
# Copy installed dependencies from installer stage
COPY --from=installer /app/node_modules ./node_modules
# Copy all source code
COPY . .
# Build the specific 'web' app
RUN npx turbo build --filter=web

# 4. Runner stage: Run the application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the entire web app directory from the builder
COPY --from=builder /app/apps/web /app/apps/web

# Copy the root node_modules
COPY --from=builder /app/node_modules /app/node_modules

# Copy the root package.json for workspace resolution
COPY --from=builder /app/package.json /app/package.json

# Set the final working directory
WORKDIR /app/apps/web

# Run the start command
CMD ["npm", "start"]
