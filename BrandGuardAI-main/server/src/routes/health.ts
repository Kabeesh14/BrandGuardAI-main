import { Router } from 'express';
import { checkDbConnection, isDbConnected } from '../db/connection.js';
import { isGeminiConfigured } from '../services/geminiService.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const mysqlLive = await checkDbConnection();
  const geminiLive = isGeminiConfigured();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      server: {
        online: true,
        port: env.PORT,
      },
      mysql: {
        configured: mysqlLive,
        host: env.MYSQL_HOST,
        port: env.MYSQL_PORT,
        database: env.MYSQL_DATABASE,
        mode: mysqlLive ? 'Connected (MySQL 8.0)' : 'In-Memory Fallback Adapter',
      },
      gemini: {
        configured: geminiLive,
        model: env.GEMINI_MODEL,
        mode: geminiLive ? 'Live Gemini AI' : 'Deterministic Engine (Demo Mode)',
      },
    },
  });
});
