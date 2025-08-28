import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { makeAuth } from './middleware/auth.js';
import health from './routes/health.js';
import deals from './routes/deals.js';
import adminRoutes from './routes/admin.js';
import { log } from './lib/logger.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(morgan('tiny'));
app.use(express.json());
app.use(makeAuth());

app.use(health);
app.use(deals);
app.use(adminRoutes);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => log(`API listening on http://localhost:${PORT}`));
