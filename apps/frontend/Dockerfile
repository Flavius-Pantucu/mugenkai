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

# For Development, build Angular in development mode
RUN if [ "$BUILD_ENV" = "development" ]; then \
      npm run build --configuration=development; \
    else \
      npm run build --configuration=production; \
    fi

# Stage 2: Development Server (For Development Environment)
FROM node:slim AS dev

WORKDIR /app

COPY --from=build /app /app

# Expose development port
EXPOSE 4200

# Run development server (Angular CLI's `ng serve`)
CMD ["npm", "run", "start"]

# Stage 3: Production Server (Nginx for Production)
FROM nginx:1.27.4-alpine-slim AS prod

# Delete default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy the built Angular application from the build stage
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Expose production port (default to 80, but can be customized)
EXPOSE 80
