# Contributing to Budget Tracker

Thanks for your interest in contributing! Budget Tracker is a privacy-first personal finance tool, and we welcome contributions of all kinds — bug fixes, new features, documentation improvements, and ideas.

## Getting Started

1. **Fork** the repository and clone your fork
2. **Set up** the development environment:
   ```bash
   cp .env.example .env
   make dev
   ```
3. The app runs at http://localhost:5173 with hot reload for both client and server

See the [Developer Guide](docs/dev/README.md) for architecture details, and [Docker Setup](docs/dev/docker.md) for environment specifics.

## How to Contribute

### Reporting Bugs

Open an [issue](https://github.com/Dreddsparc/Budget-Tracker/issues) with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser and OS (if relevant)

### Suggesting Features

Open an issue with the `enhancement` label. Describe:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

### Submitting Code

1. Create a **feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run the type checker:
   ```bash
   make typecheck
   ```
4. Test your changes manually (no test framework is configured yet — see below)
5. Commit with a clear message describing what and why
6. Push and open a **Pull Request** against `main`

### Improving Documentation

Documentation lives in two places:
- **`docs/user/`** — User-facing guides ([User Guide index](docs/user/README.md))
- **`docs/dev/`** — Developer reference ([Developer Guide index](docs/dev/README.md))

Improvements to clarity, accuracy, or completeness are always welcome.

## Project Structure at a Glance

| Directory | What's there |
|-----------|-------------|
| `client/src/` | React 19 frontend (Vite + Tailwind + DaisyUI + Recharts) |
| `server/src/` | Express API (Prisma + PostgreSQL) |
| `server/prisma/` | Database schema and seed script |
| `docs/user/` | User documentation (12 guides) |
| `docs/dev/` | Developer documentation (10 guides) |

See [CLAUDE.md](CLAUDE.md) for detailed architecture notes, API routes, and key patterns.

## Development Guidelines

### Code Style
- Follow existing patterns in the codebase
- TypeScript strict mode — `make typecheck` must pass
- Use DaisyUI component classes for UI (not custom CSS)
- Keep components focused — one file per component

### Key Patterns to Know
- All data routes are scoped under `/api/accounts/:accountId/`
- Server routes use `Router({ mergeParams: true })` — don't forget this on new routes
- Client state is centralized in `App.tsx` — child components receive data via props and trigger callbacks
- Charts accept an optional `options?: ChartFullscreenOptions` prop for fullscreen mode
- The projection engine in `projections.ts` is the core algorithm — changes here affect all views

### What We Need Help With
- **Testing**: No test framework is configured yet. Setting up Vitest + Supertest would be a huge contribution. See [Testing Guide](docs/dev/testing.md) for recommended approach.
- **Accessibility**: Screen reader support, keyboard navigation improvements
- **Mobile responsiveness**: The app works on desktop but could use mobile layout improvements
- **New chart types**: The chart system is extensible — see [Adding Features](docs/dev/adding-features.md)
- **Localization**: Currency formatting, date formats, and UI text for other languages

## Privacy Principles

Budget Tracker is local-first and privacy-respecting. When contributing, please:
- **Never** add external analytics, tracking, or telemetry
- **Never** add features that send data to external servers
- **Never** require account creation or authentication with a third-party service
- Keep the app fully functional offline (after initial Docker setup)

## Questions?

Open an issue or start a discussion. We're friendly and happy to help you get oriented in the codebase.
