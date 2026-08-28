import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(helmet());

  // CORS Configuration
  const rawOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
  const isProduction = env.NODE_ENV === 'production';
  const hasWildcard = rawOrigins.includes('*');

  if (hasWildcard && isProduction) {
    console.warn(
      '[CORS] Wildcard origin ("*") with credentials: true is disallowed in production. It will be ignored.'
    );
  }

  const allowedOrigins = isProduction
    ? rawOrigins.filter((origin) => origin !== '*')
    : rawOrigins;

  if (env.NODE_ENV !== 'test') {
    console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
  }

  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || (!isProduction && allowedOrigins.includes('*'))) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  // Request Parsing & Logging
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // API v1 Routing
  app.use('/api/v1', routes);

  // 404 Handler for unknown routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
