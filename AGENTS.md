# AGENTS.md - Campsite Management System

TypeScript monorepo: frontend (React 18 + Vite), backend (Express + Prisma), shared. **Node.js >= 22.0.0 required.**

---

## Running the App

### Docker (Production)
```bash
npm run docker:up        # Uses docker-compose.yml, builds production target
npm run docker:down      # Stop containers
docker compose down -v    # Full cleanup (removes volumes)
```

### Development
```bash
npm run dev             # Frontend dev server (Vite)
cd backend && npm run dev  # Backend with nodemon (auto-generates Prisma client)
```

### Access
| Service | URL |
|---------|-----|
| **App (preferred with full Docker prod stack)** | **`http://localhost`** (port **80**, nginx) — SPA + `/api/v1` + `/socket.io` proxied to backend; matches production same-origin API |
| Frontend (direct to container) | http://localhost:5173 |
| Backend API (direct) | http://localhost:5000 |

**Agents and docs:** When the user is testing after `npm run docker:up` / `docker compose up` with nginx, **give them `http://localhost` first**, not only `:5173` or `:5000`, so API calls and the SPA stay behind the proxy like production.

When using nginx, open the app on port **80**, not the frontend container port (5137/5173). The production bundle defaults to same-origin `/api/v1` and WebSocket on the same host so traffic stays behind nginx.

### Database
```bash
npm run db:generate     # Prisma generate (run after schema changes)
npm run db:migrate      # prisma migrate dev
npm run db:seed       # Seed data
npm run db:push       # prisma db push (fast sync, no migrations)
npm run db:studio     # prisma studio (GUI)
npm run db:setup      # generate + migrate + seed (full setup)
```

### Testing
```bash
npm run test                   # All tests
npm run test:backend           # Backend vitest
npm run test:backend:unit       # Unit tests only (*.unit.test.ts)
npm run test:backend:int       # Integration tests (*.int.test.ts, 30s timeout)
npm run test:e2e             # Playwright e2e
```

### Individual Test Commands
```bash
# Backend (run from backend/ or use -w flag)
npm run test -w @campsite-management/backend -- tests/services/booking.test.ts
cd backend && npx vitest run tests/services/booking.test.ts

# Frontend unit test
npm run test -w @campsite-management/frontend src/hooks/useAuth.test.ts

# Frontend e2e (specific browser)
npm run test:e2e:chromium -w @campsite-management/frontend
```

---

## Architecture

- **Workspaces**: `frontend/`, `backend/`, `shared/`, `tests/`
- **Shared package exports**: Used by both frontend and backend; exports Zod schemas
- **Backend path aliases**: `@/` maps to `src/` via tsconfig-paths/register
- **Frontend path aliases**: `@/` → `src/`, `@components/`, `@hooks/`, etc.
- **Backend entry**: `backend/src/index.ts` (Express server on port 5000)

### Environment
- **Frontend mock auth**: Set `VITE_USE_MOCK_AUTH=true` in `frontend/.env`
  - Test users: `admin@campsite.com`/`admin123`, `user@campsite.com`/`user123`
- **Backend config**: `backend/.env` (uses dotenv)

---

## Code Conventions

- **Component exports**: Default for pages, named for reusable components
- **Error handling**: Backend uses `ApiError` class with HTTP status codes; frontend uses service-layer try/catch
- **Validation**: Zod schemas in `shared/schemas`, validated in middleware
- **Testing**: Unit tests `*.unit.test.ts` (5s timeout), integration `*.int.test.ts` (30s)
- **Backend lint fix**: `cd backend && npm run lint:fix`

---

## Key Commands

| Task | Command |
|------|---------|
| Build all | `npm run build` |
| Lint all | `npm run lint` |
| Type-check | `npm run type-check` |
| Single backend test | `cd backend && npx vitest run tests/services/booking.test.ts` |
| Single frontend test | `cd frontend && npx vitest run src/hooks/useAuth.test.ts` |

---

## Build & Verify

```bash
npm run build           # Build all workspaces
npm run lint           # Lint all
npm run type-check     # Type-check all

# Frontend-specific
npm run build:verify   # Builds and verifies production bundle
npm run build:analyze # Analyzes bundle size
```
