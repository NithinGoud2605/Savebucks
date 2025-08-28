# savebucks
Monorepo (npm workspaces) for a community-driven US deals platform.
- apps/web: Vite + React + Tailwind
- apps/api: Express API
- packages/shared: shared JS utilities

## Getting started
1) Node v20 (`nvm use`).
2) `npm i` at repo root to install all workspaces.
3) Copy `apps/api/.env.example` to `apps/api/.env` and fill values.
4) `npm run dev` (runs API + Web).
