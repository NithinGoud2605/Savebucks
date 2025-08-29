# savebucks
Monorepo (npm workspaces) for a community-driven US deals platform.
- apps/web: Vite + React + Tailwind
- apps/api: Express API
- apps/worker: Telegram bot worker
- packages/shared: shared JS utilities

## Getting started
1) Node v20 (`nvm use`).
2) `npm i` at repo root to install all workspaces.
3) Copy `apps/api/.env.example` to `apps/api/.env` and fill values.
4) Add `TELEGRAM_BOT_TOKEN=your_bot_token` to your .env file for the worker.
5) `npm run dev` (runs API + Web).
6) `npm run dev:worker` (runs Telegram bot worker).
7) `npm run dev:telegram` (runs Telegram channel monitor).

## Telegram Bot Setup

### Development (Long Polling)
1. Create a bot with @BotFather and get your token
2. Add the bot as admin to your source channels with "Read messages" permission
3. Set `TELEGRAM_ALLOWED_CHANNELS=channel1,channel2` in your .env
4. Run `npm run dev:telegram` to start monitoring channels

### Production (Webhook)
1. Set `TELEGRAM_WEBHOOK_SECRET=your-secret-path` in your .env
2. Set `API_BASE=https://your-api-domain.com` in your .env
3. Apply SQL migration: `psql "$DATABASE_URL" -f supabase/sql/006_near_dup.sql`
4. Run `npm run -w apps/api setup-webhook` to configure the webhook
5. Start your API server - it will receive webhook updates automatically

## SEO Setup
1. Create `apps/web/.env` with:
   ```
   VITE_SITE_URL=http://localhost:5173
   VITE_DEFAULT_IMAGE=https://dummyimage.com/1200x630/ededed/222.png&text=savebucks
   ```
2. Create `apps/api/.env` with:
   ```
   SITE_URL=http://localhost:5173
   CORS_ORIGINS=http://localhost:5173
   TRUST_PROXY=true
   JSON_LIMIT=512kb
   
   # Rate limiting (optional - uses in-memory fallback if not set)
   RL_POSTS_PER_DAY=5
   RL_VOTES_PER_HOUR=60
   RL_COMMENTS_COOLDOWN_SEC=10
   RL_GO_PER_IP_PER_MIN=30
   RL_PER_DEAL_VOTE_COOLDOWN_SEC=10
   
   # Upstash Redis (optional - for production rate limiting)
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   ```
3. In production, set both URLs to your domain
4. The sitemap is automatically generated at `/sitemap.xml` (served by API)
5. Robots.txt points to the dynamic sitemap
