
# 📺 Anime & Manga Platform (Microservices-based)

A full-stack anime/manga streaming and reading platform using modern web technologies, microservices architecture, event-driven communication (Kafka), and centralized E2E testing.

---

## 🚀 Tech Stack

### Frontend
- **Angular** – UI framework for building the platform's frontend.
- **WebDriverIO** – E2E UI testing framework.

### Backend
- **NestJS** – Microservices-based architecture using HTTP & Kafka.
- **Prisma** – ORM for PostgreSQL.
- **Kafka** – Event-driven communication between microservices.
- **Zookeeper** – Kafka broker coordination.
- **PostgreSQL** – Relational database.
- **Docker Compose** – Local orchestration of services for development.

### DevOps
- **TurboRepo** / Nx – Monorepo management tool.
- **GitHub Actions** – CI/CD pipeline to automate testing, building, and deployment.
- **Docker** – Containerization for all services.

---

## 🧱 Project Structure

The project is structured using a monorepo, with multiple microservices and shared libraries.

```
📁 apps/
  📁 frontend/                 # Angular app
  📁 api-gateway/              # NestJS BFF or GraphQL Gateway
  📁 services/
    📁 auth-service/           # Authentication + JWT management
    📁 user-service/           # User profiles, favorites, history
    📁 anime-service/          # Anime metadata, episodes
    📁 manga-service/          # Manga metadata, chapters
    📁 media-service/          # Uploading, video/CDN handling
    📁 notification-service/   # Kafka consumer for alerts, emails
    📁 analytics-service/      # Kafka consumer for tracking views
  📁 e2e-tests/                # Centralized WebDriverIO-based E2E tests
    📁 tests/
      🗋 login.spec.ts
      🗋 watch-anime.spec.ts
    🗋 wdio.conf.ts

📁 libs/
  📁 kafka/                    # Kafka client abstraction
  📁 prisma/                   # Shared Prisma client
  📁 common/                   # Shared DTOs, event types, interfaces

📁 docker/
  📄 docker-compose.yml        # For local dev with all services

📄 .github/workflows/ci.yml    # CI/CD for all services
📄 package.json
📄 turbo.json or nx.json
```

---

## 🧪 Testing Strategy

### ✅ Microservices (`apps/services/*`)
- **Unit Tests**: Services, guards, resolvers, and other isolated components.
- **Integration Tests**: Integration with the database, Kafka messaging, and inter-service communication.
- **Run tests**: 
    ```bash
    pnpm --filter=auth-service test
    ```

### ✅ Frontend (`apps/frontend`)
- **Unit Tests**: Angular components and services.
- **Component Tests**: Rendering Angular components in isolation.
- **Run tests**:
    ```bash
    pnpm --filter=frontend test
    ```

### ✅ E2E Tests (`apps/e2e-tests`)
- **End-to-End Tests**: Full user flows from frontend to backend and across microservices.
- **Real browser interactions** using WebDriverIO, simulating real user interactions.
- **Run tests**:
    ```bash
    pnpm --filter=e2e-tests test
    ```

---

## 🐳 Docker Compose

All services, databases, and Kafka are started via Docker Compose:

```bash
docker-compose -f docker/docker-compose.yml up
```

The following services are exposed:

- `localhost:4200` – Angular frontend
- `localhost:3000` – API Gateway (NestJS)
- `localhost:9092` – Kafka broker
- `localhost:5432` – PostgreSQL database

---

## ⚙️ CI/CD with GitHub Actions

Each push to the `main` branch will:
- Lint, test, and build each app/service in parallel using a matrix build.
- Run DB + Kafka services in CI using Docker containers.
- Deploy to production once all tests are successfully passed.

**GitHub Actions Configuration** is located at `.github/workflows/ci.yml`.

---

## 🧠 Future Ideas

- **Authentication**: Implement OAuth, JWT, and roles-based access control.
- **SSR (Server-Side Rendering)**: Add Angular Universal for SEO optimization.
- **Media Streaming**: Implement optimized video streaming for anime/manga episodes.
- **Real-Time Updates**: Use WebSockets or Kafka to push updates to clients in real-time.
- **Monitoring**: Implement Prometheus & Grafana for system metrics.

---

## 🛠 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/en/) (LTS version)
- [pnpm](https://pnpm.io/)

### Step-by-Step Guide

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/anime-manga-platform.git
   cd anime-manga-platform
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start all services with Docker Compose**:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

4. **Start the frontend**:
   ```bash
   pnpm --filter=frontend dev
   ```

5. **Run E2E tests** (optional):
   ```bash
   pnpm --filter=e2e-tests test
   ```

6. **Access the platform**:
   - Open `http://localhost:4200` in your browser (Frontend).
   - Open `http://localhost:3000` for the API Gateway.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Feel free to fork and contribute! Here's a simple guide on how to contribute to this project:

1. Fork the repo
2. Clone your fork
3. Create a new branch (`git checkout -b feature-branch`)
4. Commit your changes (`git commit -m 'Add new feature'`)
5. Push to the branch (`git push origin feature-branch`)
6. Create a Pull Request

---

## 🔗 References

- **Angular**: [https://angular.io/](https://angular.io/)
- **NestJS**: [https://nestjs.com/](https://nestjs.com/)
- **WebDriverIO**: [https://webdriver.io/](https://webdriver.io/)
- **Kafka**: [https://kafka.apache.org/](https://kafka.apache.org/)
- **Docker Compose**: [https://docs.docker.com/compose/](https://docs.docker.com/compose/)
- **Prisma**: [https://www.prisma.io/](https://www.prisma.io/)
- **TurboRepo**: [https://turbo.build/](https://turbo.build/)
- **GitHub Actions**: [https://github.com/features/actions](https://github.com/features/actions)
