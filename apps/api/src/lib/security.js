import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import sanitizeHtml from 'sanitize-html';

// Rate limiting configuration
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// In-memory fallback for development
const createMemoryLimiter = (limit, window) => {
  const store = new Map();
  return {
    limit: async (identifier) => {
      const now = Date.now();
      const windowStart = now - window;
      
      // Clean old entries
      for (const [key, timestamp] of store.entries()) {
        if (timestamp < windowStart) store.delete(key);
      }
      
      const key = `${identifier}:${Math.floor(now / window)}`;
      const current = store.get(key) || 0;
      
      if (current >= limit) {
        return { success: false, limit, remaining: 0, reset: windowStart + window };
      }
      
      store.set(key, current + 1);
      return { success: true, limit, remaining: limit - current - 1, reset: windowStart + window };
    }
  };
};

// Rate limiters
export const rateLimiters = {
  posts: redis 
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(Number(process.env.RL_POSTS_PER_DAY || 5), '1 d') })
    : createMemoryLimiter(Number(process.env.RL_POSTS_PER_DAY || 5), 24 * 60 * 60 * 1000),
    
  votes: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(Number(process.env.RL_VOTES_PER_HOUR || 60), '1 h') })
    : createMemoryLimiter(Number(process.env.RL_VOTES_PER_HOUR || 60), 60 * 60 * 1000),
    
  comments: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, `${process.env.RL_COMMENTS_COOLDOWN_SEC || 10} s`) })
    : createMemoryLimiter(1, (Number(process.env.RL_COMMENTS_COOLDOWN_SEC || 10)) * 1000),
    
  go: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(Number(process.env.RL_GO_PER_IP_PER_MIN || 30), '1 m') })
    : createMemoryLimiter(Number(process.env.RL_GO_PER_IP_PER_MIN || 30), 60 * 1000),
    
  dealVotes: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, `${process.env.RL_PER_DEAL_VOTE_COOLDOWN_SEC || 10} s`) })
    : createMemoryLimiter(1, (Number(process.env.RL_PER_DEAL_VOTE_COOLDOWN_SEC || 10)) * 1000),
};

// CORS configuration
export const corsOptions = {
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

// Helmet configuration
export const helmetConfig = {
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

// Input sanitization
export const sanitizeConfig = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote', 'code', 'pre'
  ],
  allowedAttributes: {},
  allowedIframeHostnames: [],
};

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, sanitizeConfig);
}

// Trust proxy configuration
export const trustProxy = process.env.TRUST_PROXY === 'true';

// JSON limit configuration
export const jsonLimit = process.env.JSON_LIMIT || '512kb';

// Rate limiting middleware factory
export function createRateLimiter(limiter, identifier = 'ip') {
  return async (req, res, next) => {
    try {
      const id = identifier === 'ip' ? req.ip : req.user?.id || req.ip;
      const result = await limiter.limit(id);
      
      if (!result.success) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        });
      }
      
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.reset).toISOString());
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };
}
