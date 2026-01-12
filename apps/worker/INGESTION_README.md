# Automated Deal Ingestion System

Production-ready system for automatically fetching, processing, and managing deals/coupons from multiple sources.

## Quick Start

### 1. Install Dependencies
```bash
cd apps/worker
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your Redis URL and API keys
```

### 3. Start Redis (Required)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or use your existing Redis instance
```

### 4. Run Ingestion Worker
```bash
# Development
npm run ingestion:dev

# Production
npm run ingestion
```

### 5. Run Expiry Manager
```bash
npm run expiry
```

## Features

✅ **Multi-Source Ingestion**
- Affiliate APIs (CJ, Amazon, Impact)
- RSS Feeds (Slickdeals, DealNews, etc.)
- Web scraping (optional)

✅ **Smart Deduplication**
- URL hash matching
- External ID tracking
- Title similarity (85%+)

✅ **Automatic Management**
- Hourly expiry checks
- Auto-approve trusted sources
- Company matching/creation

✅ **Quality Assurance**
- Input validation
- Price logic checks
- Error logging

## Architecture

```
apps/worker/src/jobs/
├── ingestion/
│   ├── index.js          # Main entry
│   ├── worker.js         # BullMQ worker
│   ├── scheduler.js      # Job scheduler
│   ├── sources/
│   │   └── registry.js   # Source configs
│   ├── fetchers/
│   │   └── rssFetcher.js # RSS parser
│   └── processors/
│       ├── dealProcessor.js    # Main processor
│       └── companyMatcher.js   # Company matching
|
├── expiry/
│   ├── index.js          # Expiry entry
│   └── expiryManager.js  # Expiry logic
|
└── lib/
    ├── queue.js          # BullMQ setup
    ├── deduper.js        # Deduplication
    └── supabase.js       # DB client
```

## Configuration

### Enable/Disable Sources

Edit `src/jobs/ingestion/sources/registry.js`:

```javascript
slickdeals_rss: {
  enabled: true,  // Toggle this
  // ...
}
```

### Add New Source

1. Add to `registry.js`
2. Create fetcher in `fetchers/`
3. Follow existing patterns

## Monitoring

### Queue Status
```bash
# Check queue health
curl http://localhost:3002/health
```

### Logs
- Ingestion results logged to console
- Errors logged to `ingestion_errors` table

## Production Deployment

### Docker (Recommended)
```bash
# Build
docker build -t savebucks-worker .

# Run ingestion
docker run -e REDIS_URL=redis://redis:6379 savebucks-worker npm run ingestion

# Run expiry
docker run -e REDIS_URL=redis://redis:6379 savebucks-worker npm run expiry
```

### PM2
```bash
pm2 start npm --name "ingestion" -- run ingestion
pm2 start npm --name "expiry" -- run expiry
```

## Cost Estimates

**Free Tier:**
- RSS feeds: Free
- Redis (self-hosted): $0

**Paid Options:**
- Redis Cloud: $20-50/mo
- OpenAI enrichment: $50-150/mo
- Proxies (if needed): $100-300/mo

**Total:** $0-500/mo depending on scale

## Troubleshooting

### Redis connection failed
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### No deals being fetched
1. Check source is enabled in registry
2. Verify API keys in .env
3. Check rate limits

### Duplicates still appearing
- Deduplication runs per-deal
- Check URL normalization
- Verify company matching

## Next Steps

1. Sign up for affiliate networks
2. Test with RSS feeds first
3. Monitor for 24h
4. Enable API sources gradually
5. Scale as needed
