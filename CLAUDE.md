# Stackr — Multi-Chain Portfolio Tracker

## Project Overview

Stackr is a multi-chain address watcher where users can add BTC/STX/ETH/SOL wallet addresses, view balances, and eventually NFTs. PWA-enabled, dark theme.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js (App Router) deployed to Cloudflare via @opennextjs/cloudflare
- **Mobile**: Expo React Native (minimal scaffold)
- **Styling**: Panda CSS with @stackr/panda-preset
- **State**: TanStack React Query (server) + Zustand (client/persisted wallet list)
- **Testing**: Vitest (unit) + Playwright (e2e)
- **CI/CD**: GitHub Actions + release-please

## Workspace Structure

- `packages/tsconfig-config` — Shared TypeScript configs
- `packages/prettier-config` — Shared Prettier config
- `packages/eslint-config` — Shared ESLint flat configs
- `packages/panda-preset` — Design tokens, dark theme, recipes
- `packages/models` — Zod schemas + types (Wallet, Balance, Chain)
- `packages/services` — Multi-chain API clients (BTC, STX, ETH, SOL)
- `packages/queries` — TanStack React Query hooks + query key factories
- `packages/ui` — Shared React components
- `apps/web` — Next.js web app
- `apps/mobile` — Expo mobile app

## Common Commands

```bash
pnpm build          # Build all packages and apps
pnpm dev:web        # Start Next.js dev server
pnpm lint           # Lint all packages
pnpm typecheck      # Type check all packages
pnpm test:unit      # Run Vitest unit tests
pnpm test:e2e       # Run Playwright e2e tests
```

## Conventions

- All packages scoped under `@stackr/*`
- Commit messages follow Conventional Commits (enforced by commitlint)
- ESLint flat config format
- Node 22+, pnpm 9+
