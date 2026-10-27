import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { checkDbConnection } from './db/connection.js';
import { isGeminiConfigured } from './services/geminiService.js';
import { healthRouter } from './routes/health.js';
import { brandsRouter } from './routes/brands.js';
import { auditsRouter } from './routes/audits.js';
import { analyticsRouter } from './routes/analytics.js';
import { authRouter } from './routes/auth.js';
import { isFirebaseConfigured } from './auth/firebase.js';

const app = express();

// Determine allowed origins based on environment
const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
const configuredOrigins = env.FRONTEND_ORIGIN
  ? env.FRONTEND_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = new Set<string>(
  env.NODE_ENV === 'production'
    ? configuredOrigins
    : [...configuredOrigins, ...defaultDevOrigins]
);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, same-origin, health checks)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Reject unapproved origins
      return callback(new Error(`CORS blocked: Origin '${origin}' is not permitted.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json({ limit: '15mb' }));

// Mount API routes
app.use('/api/health', healthRouter);
app.use('/api', authRouter);
app.use('/api', brandsRouter);
app.use('/api', auditsRouter);
app.use('/api', analyticsRouter);

// Root fallback
app.get('/', (_req, res) => {
  res.json({
    name: 'BrandGuard AI API Server',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Global error handling middleware (catches CORS rejections and unexpected errors)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err && typeof err.message === 'string' && err.message.includes('CORS blocked')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const server = app.listen(env.PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 BrandGuard AI Backend listening on port ${env.PORT}`);
  console.log(`  📡 API endpoint: http://localhost:${env.PORT}/api`);
  console.log(`======================================================`);

  // Check initial service connectivity
  const dbOk = await checkDbConnection();
  if (dbOk) {
    console.log(`  ✅ MySQL Database: Connected (host=${env.MYSQL_HOST}:${env.MYSQL_PORT}, db=${env.MYSQL_DATABASE})`);
  } else {
    console.log(`  ℹ️  MySQL Database: Offline / Credentials pending (Using in-memory seed adapter)`);
  }

  const geminiOk = isGeminiConfigured();
  if (geminiOk) {
    console.log(`  ✅ Google Gemini AI: Active (${env.GEMINI_MODEL})`);
  } else {
    console.log(`  ℹ️  Google Gemini AI: Key not detected (Audits run via deterministic engine)`);
  }

  const firebaseOk = isFirebaseConfigured();
  if (firebaseOk) {
    console.log(`  🔥 Authentication: Firebase Admin SDK Active (ID Token Verification)`);
  } else {
    console.log(`  🔑 Authentication: Cryptographic JWT & Server-Side RBAC Active`);
  }

  const originsList = [...allowedOrigins].join(', ') || 'None (all rejected)';
  console.log(`  🔒 CORS Allowed Origins (${env.NODE_ENV}): [${originsList}]`);
  console.log(`======================================================\n`);
});

export default app;
