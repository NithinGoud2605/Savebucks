import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { makeAuth } from './middleware/auth.js';
import health from './routes/health.js';
import deals from './routes/deals.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import categoriesRoutes from './routes/categories.js';
import couponsRoutes from './routes/coupons.js';
import companiesRoutes from './routes/companies.js';
import tagsRoutes from './routes/tags.js';
import searchRoutes from './routes/search.js';
import savedSearchesRoutes from './routes/savedSearches.js';
import reviewsRoutes from './routes/reviews.js';
import savedItemsRoutes from './routes/savedItems.js';
import personalizationRoutes from './routes/personalization.js';
import notificationsRoutes from './routes/notifications.js';
import autoTaggingRoutes from './routes/autoTagging.js';
import gamificationRoutes from './routes/gamification.js';
import navbarRoutes from './routes/navbar.js';
import statsRoutes from './routes/stats.js';
import analyticsRoutes from './routes/analytics.js';
import filtersRoutes from './routes/filters.js';
import restaurantsRoutes from './routes/restaurants.js';
import goRoutes from './routes/go.js';
import tempDataRoutes from './routes/temp-data.js';
import debugRoutes from './routes/debug.js';
import feedRoutes from './routes/feed.js';
import forYouRoutes from './routes/for-you.js';
import referralsRoutes from './routes/referrals.js';
import userAnalyticsRoutes from './routes/user-analytics.js';
import reactionsRoutes from './routes/reactions.js';
import aiRoutes from './routes/ai.js';
import { log } from './lib/logger.js';

const app = express();
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(compression({
  filter: (req, res) => {
    if (req.headers['accept'] && req.headers['accept'].includes('text/event-stream')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(morgan('tiny'));
app.use(express.json());
app.use(makeAuth());

app.use(health);
app.use('/api/auth', authRoutes);
app.use('/api/users', makeAuth(), usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/saved-searches', savedSearchesRoutes);
app.use('/api/reviews', makeAuth(), reviewsRoutes);
app.use('/api/saved-items', savedItemsRoutes);
app.use('/api/personalization', makeAuth(), personalizationRoutes);
app.use('/api/notifications', makeAuth(), notificationsRoutes);
app.use('/api/auto-tagging', autoTaggingRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/navbar', navbarRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/deals', makeAuth(), deals);
app.use('/api/admin', adminRoutes);
app.use('/api/feed', feedRoutes); // Unified feed endpoint
app.use('/api/for-you', forYouRoutes); // Personalized For You recommendations
app.use('/api/referrals', referralsRoutes); // Referral system
app.use('/api/user-analytics', userAnalyticsRoutes); // User analytics dashboard
app.use('/api/reactions', reactionsRoutes); // Comment reactions
app.use('/api/ai', makeAuth(), aiRoutes); // AI chat endpoint
app.use('/api', tempDataRoutes);
app.use('/api', debugRoutes); // Debug routes
app.use(goRoutes);


// Serve static files from the built frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '../../web/dist');

// Serve static files (but only for non-API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/go/')) {
    return next();
  }
  express.static(frontendPath)(req, res, next);
});

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/go/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Check if the request is for a static file
  if (req.path.includes('.')) {
    return res.status(404).send('File not found');
  }

  // Serve React app for all other routes
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => log(`API listening on http://localhost:${PORT}`));
