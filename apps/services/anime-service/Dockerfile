# ---------- Base Stage ----------
FROM node:slim AS base

WORKDIR /app

# Install system dependencies (including OpenSSL)
RUN apt-get update && apt-get install -y procps openssl

# Copy only package files to install dependencies first (better caching)
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm install

# Copy Prisma schema before generating client
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# ---------- Development Stage ----------
FROM base AS dev

# Copy entire project (excluding what's in .dockerignore)
COPY . .

# Start the app in development mode
CMD ["npm", "run", "start:dev"]

# ---------- Build Stage ----------
FROM base AS build

# Copy the rest of the app
COPY . .

# Build the app
RUN npm run build

# ---------- Production Stage ----------
FROM node:slim AS prod

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm install --only=production

# Copy build output and generated Prisma client
COPY --from=build /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma

# Start app in production mode
CMD ["node", "dist/main.js"]