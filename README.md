# 📺 Anime & Manga Platform (Microservices-based)

A full-stack anime/manga streaming and reading platform using modern web technologies, microservices architecture, event-driven communication and centralized E2E testing.

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

- **TurboRepo** – Monorepo management tool.
- **GitHub Actions** – CI/CD pipeline to automate testing, building, and deployment.
- **Docker** – Containerization for all services.

---

## 🧱 Project Structure

The project is structured using a monorepo, with multiple microservices and shared libraries.

```
📁 apps/
  📁 frontend/                 # Angular
  📁 api-gateway/              # NestJS
  📁 services/
    📁 auth-service/           # Authentication + JWT management
    📁 user-service/           # User profiles, favorites, history
    📁 anime-service/          # Anime metadata, episodes
    📁 manga-service/          # Manga metadata, chapters
  📁 e2e-tests/                # Centralized WebDriverIO-based E2E tests
    📁 tests/
📁 docker/
  📄 docker-compose.prod.yml       # For prod with all services
  📄 docker-compose.dev.yml        # For dev with all services
📄 .github/workflows/ci.yml    # CI/CD for all services
📄 package.json
📄 turbo.json
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
# To start the services
pnpm run docker:dev:up
pnpm run docker:prod:up

# To stop the services
pnpm run docker:dev:down
pnpm run docker:prod:down

# To show logs
pnpm run docker:dev:logs
pnpm run docker:prod:logs
```

The following services are exposed:

- `localhost:4200` – Angular frontend
- `localhost:3000` – API Gateway (NestJS)
- `localhost:3001-3004` – Microservices (auth, user, anime, manga)
- `localhost:9092` – Kafka broker
- `localhost:5432-5435` – PostgreSQL database

---

## ⚙️ CI/CD with GitHub Actions

Each push to the `main` branch will:

- Lint, test, and build each app/service in parallel using a matrix build.
- Run DB + Kafka services in CI using Docker containers.
- Deploy to production once all tests are successfully passed.

**GitHub Actions Configuration** is located at `.github/workflows/ci.yml`.

---

## 🛠 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/en/) (LTS version)
- [pnpm](https://pnpm.io/)

### Step-by-Step Guide

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Flavius-Pantucu/mugenkai.git
   cd mugenkai
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start all services with Docker Compose**:

   ```bash
   pnpm run docker:dev:up
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
