# ---------- Base Stage ----------
    FROM node:slim AS base

    # Set working directory
    WORKDIR /app
    # Copy package files separately to install deps first
    COPY package.json package-lock.json ./
    # Install dependencies
    RUN apt-get update && apt-get install -y procps 
    RUN npm install 

    # ---------- Development Stage ----------
    FROM base AS dev

    # Copy the rest of the app
    COPY . .
    # Start the app
    CMD ["npm", "run", "start:dev"]
    
    # ---------- Build Stage ----------
    FROM base AS build

    # Copy the rest of the app
    COPY . .
    # Build the NestJS app
    RUN npm run build
    
    # ---------- Production Stage ----------
    FROM node:slim AS prod

    # Set working directory
    WORKDIR /app
    # Copy package files separately to install deps first
    COPY package.json package-lock.json ./
    # Install dependencies
    RUN npm install --prod
    # Copy only built files and node_modules
    COPY --from=build /app/dist ./dist
    # Start the app
    CMD ["npm", "run", "start:prod"]
    