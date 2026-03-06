# Stage 1: Base Image for Build
FROM node:slim AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Get BUILD_ENV from build args
ARG BUILD_ENV

# For Development, build React in development mode
RUN if [ "$BUILD_ENV" = "development" ]; then \
      npm run build -- --mode development; \
    else \
      npm run build; \
    fi

# Stage 2: Development Server (For Development Environment)
FROM node:slim AS dev

WORKDIR /app

COPY --from=build /app /app

# Expose development port
EXPOSE 4321

# Run development server
CMD ["npm", "run", "dev"]

# Stage 3: Production Server (Nginx for Production)
FROM nginx:1.27.4-alpine-slim AS prod

# Delete default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy the built React (Vite) application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose production port
EXPOSE 80