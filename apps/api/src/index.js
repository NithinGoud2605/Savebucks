import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { makeAuth } from './middleware/auth.js';
import health from './routes/health.js';
import deals from './routes/deals.js';
import adminRoutes from './routes/admin.js';
import go from './routes/go.js';
import telegramRoutes from './routes/telegram.js';
import sitemap from './routes/sitemap.js';
import { log } from './lib/logger.js';

const app = express();

if ((process.env.TRUST_PROXY ?? 'true').toLowerCase() !== 'false') {
  app.set('trust proxy', 1);
}

const origins = (process.env.CORS_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : false,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(compression());
app.use(morgan('tiny'));
app.use(express.json({ limit: process.env.JSON_LIMIT || '512kb' }));
app.use(makeAuth());

app.use(health);
app.use(deals);
app.use(adminRoutes);
app.use(go);
app.use(telegramRoutes);
app.use(sitemap);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => log(`API listening on http://localhost:${PORT}`));
