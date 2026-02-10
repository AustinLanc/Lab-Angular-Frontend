# LabFrontend

An Angular 21 single-page application for managing grease/lubricant manufacturing operations — batch tracking, quality control logging, retain sample management, laboratory testing data, production statistics, and batch reminder notifications.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Docker Deployment](#docker-deployment)
6. [Configuration](#configuration)
7. [Authentication](#authentication)
8. [Pages & Components](#pages--components)
9. [Services](#services)
10. [Styling](#styling)
11. [Testing](#testing)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Angular 21 App                                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │  │
│  │  │ Services │→ │HttpClient│→ │Auth Interceptor│  │  │
│  │  └──────────┘  └──────────┘  └────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ /api/* requests
          ┌────────────────┼────────────────┐
          │ Development    │                │ Production
          │ ng serve       │                │ Docker
          │ proxy.conf.json│                │ nginx.conf
          ▼                │                ▼
┌──────────────────┐       │    ┌───────────────────────┐
│ localhost:8080   │       │    │ nginx (port 80)       │
│ Spring Boot API  │       │    │ proxy_pass backend:8080│
└──────────────────┘       │    └───────────────────────┘
```

**Development:** Angular's dev server on port 4200 proxies `/api/*` to `localhost:8080` via `proxy.conf.json`.

**Production:** The app is compiled to static files and served by nginx in a Docker container. nginx proxies `/api/` to the backend container and handles SPA routing.

---

## Technology Stack

| Component | Technology | Version |
|-|-|-|
| Framework | Angular | 21.1.0 |
| Language | TypeScript | 5.9.2 |
| Build Tool | Angular CLI | 21.1.1 |
| Styling | Tailwind CSS + DaisyUI | 4.1.12 / 5.0.0 |
| Charts | Chart.js | 4.5.1 |
| HTTP | Angular HttpClient + RxJS | 7.8.x |
| Testing | Vitest | 4.0.8 |
| Package Manager | npm | 10.9.2 |
| Containerization | Docker (nginx) | multi-stage build |

---

## Project Structure

```
src/
├── main.ts                          # Browser entry point (bootstrapApplication)
├── main.server.ts                   # SSR entry point (optional, not used in Docker build)
├── server.ts                        # Express SSR server (optional)
├── styles.css                       # Global styles (Tailwind v4 + DaisyUI + custom theme)
│
├── app/
│   ├── app.ts                       # Root component (sidebar layout, search, notifications)
│   ├── app.html                     # Root template
│   ├── app.css                      # Root styles
│   ├── app.config.ts                # Application config (router, HttpClient, interceptors)
│   ├── app.config.server.ts         # SSR config (optional)
│   ├── app.routes.ts                # Route definitions with auth guards
│   ├── app.routes.server.ts         # SSR route config (optional)
│   │
│   ├── models.ts                    # TypeScript interfaces (Retain, QcLog, Batch, etc.)
│   ├── api.service.ts               # HTTP client wrapping all backend endpoints
│   ├── auth.service.ts              # Auth state management (signals)
│   ├── auth.guard.ts                # Route guard (redirects to /login if not authenticated)
│   ├── auth.interceptor.ts          # Attaches JWT to every HTTP request
│   │
│   ├── login/                       # Login page (LDAP authentication)
│   │   ├── login.ts
│   │   ├── login.html
│   │   └── login.css
│   │
│   ├── update/                      # Retain entry page (barcode scanning)
│   │   ├── update.ts
│   │   ├── update.html
│   │   └── update.css
│   │
│   ├── retains/                     # Retain inventory view (filtered, searchable table)
│   │   ├── retains.ts
│   │   ├── retains.html
│   │   └── retains.css
│   │
│   ├── qc/                          # QC logs view (date parsing, search)
│   │   ├── qc.ts
│   │   ├── qc.html
│   │   └── qc.css
│   │
│   ├── results/                     # Lab testing data (dynamic column toggles)
│   │   ├── results.ts
│   │   ├── results.html
│   │   └── results.css
│   │
│   ├── reminders/                   # Batch reminders (overdue/due today/upcoming)
│   │   ├── reminders.ts
│   │   ├── reminders.html
│   │   └── reminders.css
│   │
│   └── production/                  # Production stats (Chart.js bar chart)
│       ├── production.ts
│       ├── production.html
│       └── production.css
│
├── public/                          # Static assets

Dockerfile                           # Multi-stage build (Node 22 → nginx Alpine)
nginx.conf                           # Production nginx config (API proxy + SPA routing)
.dockerignore                        # Files excluded from Docker context
proxy.conf.json                      # Development API proxy config
angular.json                         # Angular CLI configuration
tsconfig.json                        # TypeScript configuration
tsconfig.app.json                    # App-specific TypeScript config
tsconfig.spec.json                   # Test TypeScript config (Vitest globals)
package.json                         # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

* **Node.js 22+** (LTS recommended)
* **npm 10+**
* The **Spring Boot backend** running on port 8080 (see [Lab-Spring-Boot-Backend](../Lab-Spring-Boot-Backend))

### 1. Install dependencies

```bash
cd Lab-Angular-Frontend
npm install
```

### 2. Start the development server

```bash
npm start
# or: ng serve
```

The app starts on **http://localhost:4200**. API requests are proxied to `localhost:8080` via `proxy.conf.json`.

### 3. Build for production

```bash
npm run build -- --configuration=production
```

Output goes to `dist/labfrontend/browser/`.

### 4. Run tests

```bash
npm test
# or: ng test
```

Uses Vitest with `@angular/build:unit-test` builder.

---

## Docker Deployment

### Build and run

```bash
docker build -t lab-frontend .
docker run -p 80:80 lab-frontend
```

### How it works

**Build stage** (`node:22-alpine`):
1. `npm ci` installs dependencies
2. `npm run build -- --configuration=production` compiles the Angular app
3. Output: `dist/labfrontend/browser/` (static HTML, JS, CSS)

**Runtime stage** (`nginx:alpine`):
1. Static files copied to `/usr/share/nginx/html`
2. `nginx.conf` handles three concerns:
   - `/api/` proxied to `http://backend:8080/api/` (Docker service name)
   - All other routes fall through to `index.html` (SPA routing)
   - Static assets cached for 1 year with immutable headers
3. Gzip compression enabled for text, CSS, JSON, JS

**Health check:** `wget` polls `http://localhost:80` every 30 seconds.

### Docker Compose (with backend)

```yaml
services:
  backend:
    build: ./Lab-Spring-Boot-Backend
    ports:
      - "8080:8080"
    env_file: ./Lab-Spring-Boot-Backend/.env

  frontend:
    build: ./Lab-Angular-Frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## Configuration

### Development Proxy (`proxy.conf.json`)

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

All `/api/*` requests from the Angular dev server are forwarded to the Spring Boot backend.

### Production Proxy (`nginx.conf`)

In Docker, nginx proxies `/api/` to the backend container at `http://backend:8080/api/`. The `backend` hostname is resolved by Docker's internal DNS.

### Angular Build (`angular.json`)

| Setting | Value |
|-|-|
| Builder | `@angular/build:application` |
| Browser entry | `src/main.ts` |
| Production budget (initial) | Warning: 500kB, Error: 1MB |
| Output hashing | All (production) |
| Source maps | Enabled (development only) |
| Test builder | `@angular/build:unit-test` (Vitest) |

**Note:** The SSR source files (`main.server.ts`, `server.ts`, `app.config.server.ts`, `app.routes.server.ts`) exist in the repo but are **not configured** in the `angular.json` build pipeline. The production Docker build produces a client-side SPA only.

---

## Authentication

### Flow

1. User submits credentials on the `/login` page
2. `AuthService.login()` sends `POST /api/auth/login` to the backend
3. Backend validates against LDAP, returns a JWT + sets `auth_token` cookie
4. Token is stored in `localStorage` as a backup
5. `authInterceptor` attaches the token to every subsequent request (via `Authorization: Bearer` header + `withCredentials: true` for cookies)

### Route Protection

All routes except `/login` are protected by `authGuard`:

```typescript
{ path: 'qc', component: Qc, data: { title: 'QC Logs' }, canActivate: [authGuard] }
```

The guard checks `AuthService.isAuthenticated()` (a signal). If the auth check is still in-flight (page refresh), it waits for it to complete before deciding.

### State Management

Auth state uses Angular **signals**:

```typescript
isAuthenticated = signal(false);
currentUser = signal<User | null>(null);
isLoading = signal(true);
```

On startup, `AuthService` calls `GET /api/auth/me` to restore the session from the JWT cookie.

---

## Pages & Components

| Route | Component | Description |
|-|-|-|
| `/login` | Login | LDAP authentication form |
| `/` → `/update` | Update | Retain entry with barcode scanning (product code + batch) |
| `/retains` | Retains | Searchable/filterable retain inventory table |
| `/qc` | Qc | QC log management with date range parsing |
| `/results` | Results | Lab testing data with dynamic column toggles (22+ test types) |
| `/reminders` | Reminders | Batch reminders with overdue/due today/upcoming status |
| `/production` | Production | Monthly production stats with Chart.js bar chart |

### Root Component (`app.ts`)

The root component manages:
- **Sidebar layout** with collapsible navigation
- **Global search** with debounced queries across QC, retains, and results (using `forkJoin`)
- **Reminder count** badge polled every 5 minutes
- **Page title** tracking via router events

---

## Services

### `api.service.ts`

Singleton service wrapping every backend endpoint with typed `Observable` methods:

```typescript
getRetains(): Observable<Retain[]>
createRetain(retain: Retain): Observable<Retain>
deleteRetain(id: number): Observable<void>
searchRetains(query: string): Observable<Retain[]>
// ... methods for all 6 resources + stats
```

### `auth.service.ts`

Manages authentication state with signals. Methods: `login()`, `logout()`, `checkAuthStatus()`.

### `auth.interceptor.ts`

Functional interceptor that attaches JWT credentials to every HTTP request:
- Sets `withCredentials: true` (sends cookies)
- Adds `Authorization: Bearer <token>` header from `localStorage`

---

## Styling

### Tailwind CSS v4 + DaisyUI 5

Global styles in `src/styles.css` use Tailwind v4's PostCSS plugin syntax:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark;
}
```

### Theme Colors

| Variable | Color | Usage |
|-|-|-|
| `--primary` | `#1e40af` (blue) | Buttons, active nav items |
| `--secondary` | `#475569` (slate) | Secondary actions |
| `--accent` | `#0891b2` (cyan) | Accent elements |
| `--neutral` | `#1f2937` (dark gray) | Neutral backgrounds |
| `--base-100/200/300` | White → light gray | Page backgrounds, borders |

### Custom CSS

- Scrollbar styling for table overflow containers
- Sidebar collapse/expand transitions
- Active navigation item highlighting
- Status badge colors (pending/approved/rejected)
- Print styles (`.no-print`, `.print-full-width`)

---

## Testing

The project uses **Vitest** as its test runner, configured via:

- `angular.json`: `test` architect uses `@angular/build:unit-test`
- `tsconfig.spec.json`: includes `vitest/globals` types
- Test DOM environment: `jsdom`

Test files follow Angular convention: `*.spec.ts` alongside their components.

```bash
# Run all tests
npm test

# Run tests in watch mode
ng test --watch
```

Existing test files:
- `app.spec.ts`
- `qc/qc.spec.ts`
- `reminders/reminders.spec.ts`
- `results/results.spec.ts`
- `retains/retains.spec.ts`
- `update/update.spec.ts`
