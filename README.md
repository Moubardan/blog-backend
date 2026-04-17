# Full Stack Blog Platform

This project is a modern full-stack blog platform built with **Next.js** (frontend), **NestJS** (backend API), **Prisma** (ORM), and **PostgreSQL** (database). It features authentication, article management, comments, and a clean author dashboard. The stack is containerized with Docker for easy local development.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Frontend Overview](#frontend-overview)
- [Shared Types](#shared-types)
- [Sample Data](#sample-data)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Features
- User registration, login, JWT authentication (NestJS, NextAuth.js)
- Create, edit, delete, and list blog posts
- Comment on articles (authenticated users)
- Author dashboard with post management
- Responsive UI with modern React (Next.js App Router)
- Server Actions and Zod validation (Next.js)
- Prisma ORM for database access
- Type-safe shared types between frontend and backend
- E2E and integration tests (Playwright, Jest)
- Dockerized for local development

---

## Architecture
- **api/**: NestJS REST API (TypeORM, JWT, DTO validation)
- **web/**: Next.js 14 frontend (App Router, NextAuth.js, Prisma, Playwright)
- **shared/**: TypeScript types shared between frontend and backend
- **docker-compose.yml**: Orchestrates PostgreSQL, API, and frontend

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) >= 18
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (for local development)

### Local Development (Recommended)

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd projet_full_stack
   ```
2. **Start with Docker Compose:**
   ```sh
   docker-compose up --build
   ```

   - API (local): http://localhost:4000
   - Web (local): http://localhost:3000
   - PostgreSQL: localhost:5432 (user: postgres, password: postgres)
   - API (production): https://blog-backend-production-46c6.up.railway.app
   - Web (production): https://blog-frontend-five-flame.vercel.app/

3. **Seed the database (optional):**
   ```sh
   cd web
   yarn db:seed
   ```

4. **Run tests:**
   - API: `cd api && yarn test`
   - Web E2E: `cd web && yarn test:e2e`

### Manual Setup (without Docker)

#### API (NestJS)
1. `cd api`
2. Copy `.env.example` to `.env` and adjust variables as needed
3. Install dependencies: `yarn install`
4. Start the API: `yarn start:dev` (or `yarn start` for production)
5. API runs on http://localhost:4000

#### Web (Next.js)
1. `cd web`
2. Copy `.env.example` to `.env` and adjust variables as needed
3. Install dependencies: `yarn install`
4. Run database migrations: `yarn db:migrate`
5. (Optional) Seed the database: `yarn db:seed`
6. Start the frontend: `yarn dev`
7. Web runs on http://localhost:3000

---

## Project Structure
```
projet_full_stack/
├── api/         # NestJS backend API
├── web/         # Next.js frontend
├── shared/      # Shared TypeScript types
├── docker-compose.yml
└── sample-articles.md
```

---

## API Overview (NestJS)
- **Auth:** `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/profile`
- **Posts:** `/posts` (CRUD), `/posts/mine`, `/posts/:id`, `/posts/:id/comments`
- **Comments:** Add via `/posts/:id/comments` (auth required)
- **Validation:** DTOs with class-validator
- **Guards:** JWT authentication, owner checks

---

## Frontend Overview (Next.js)
- **Pages:**
  - `/` — List articles
  - `/articles/[slug]` — Article detail & comments
  - `/login` — User login
  - `/dashboard` — Author dashboard (protected)
  - `/dashboard/new` — Create post
  - `/dashboard/[id]/edit` — Edit post
  - `/profile` — User profile (protected)
- **Authentication:** NextAuth.js (JWT strategy, credentials provider)
- **Forms:** Server Actions, Zod validation
- **Prisma:** ORM for DB access, migrations, and seeding

---

## Shared Types
- Located in `shared/types/`
- Used by both API and frontend for DTOs, API responses, etc.

---

## Sample Data
- See `sample-articles.md` for example articles
- Seed script: `web/prisma/seed.ts`

---

## Testing
- **API:** Jest unit & e2e tests (`api/test/`)
- **Frontend:** Playwright E2E tests (`web/tests/e2e/`)

---

## Environment Variables
- See `.env.example` files in `api/` and `web/`
- Main variables:
  - `DATABASE_URL`, `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - `API_URL`, `NEXT_PUBLIC_API_URL`

---

## License
MIT
