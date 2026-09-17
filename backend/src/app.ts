import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { AppError, errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  /**
   * Render (and any other managed host) terminates TLS at a load balancer and
   * forwards the request over plain HTTP with X-Forwarded-*. Without this,
   * `req.ip` is the load balancer for every visitor, `req.protocol` is always
   * 'http', and express-rate-limit warns that it cannot identify clients.
   *
   * One hop only — trusting more would let a caller forge X-Forwarded-For and
   * choose their own rate-limit bucket.
   */
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }

        // In development, automatically allow VS Code Dev Tunnels, Localtunnel, Ngrok, and localhost variants
        if (env.NODE_ENV !== 'production') {
          try {
            const parsed = new URL(origin);
            const host = parsed.hostname.toLowerCase();
            if (
              host === 'localhost' ||
              host === '127.0.0.1' ||
              host.endsWith('.devtunnels.ms') ||
              host.endsWith('.loca.lt') ||
              host.endsWith('.ngrok-free.app') ||
              host.endsWith('.ngrok.io') ||
              host.endsWith('.ngrok.app')
            ) {
              return callback(null, true);
            }
          } catch {
            // Invalid origin URL format, fall through to rejection
          }
        }

        // A disallowed origin is a client error, not a server fault. Tag it so the
        // shared error handler answers 403 instead of recording a CRITICAL 500.
        const rejection: AppError = new Error(`Origin ${origin} is not allowed by CORS`);
        rejection.statusCode = 403;
        rejection.code = 'CORS_FORBIDDEN';
        return callback(rejection);
      },
      credentials: true,
    })
  );

  // Request Parsing & Logging
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  if (env.NODE_ENV !== 'test') {
    // Strip query parameters from Morgan access logs so sensitive query tokens
    // (such as ?t=... bearer tokens for quotation PDFs) are not written to stdout or cloud log stores.
    morgan.token('url', (req: Request) => {
      const url = req.originalUrl || req.url || '';
      const qIdx = url.indexOf('?');
      return qIdx >= 0 ? url.substring(0, qIdx) : url;
    });
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
