import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { AppError, errorHandler } from './middleware/errorHandler.js';
import { createOriginPolicy, rejectCrossSiteWrites } from './middleware/origin.js';

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
  const originPolicy = createOriginPolicy({
    corsOrigin: env.CORS_ORIGIN,
    publicBaseUrl: env.PUBLIC_BASE_URL,
    production: env.NODE_ENV === 'production',
  });

  if (originPolicy.wildcard) {
    console.warn(
      '[cors] CORS_ORIGIN contains "*". Other sites may read public responses, but never with ' +
        'credentials, and cannot send writes. List the site origins explicitly instead.'
    );
  }

  app.use(
    cors((req, callback) => {
      const origin = req.header('origin');

      // No Origin: curl, server-to-server, or a same-origin navigation.
      if (!origin || originPolicy.isTrusted(origin)) {
        return callback(null, { origin: true, credentials: true });
      }

      // `*` means readable by anyone — without credentials, so an admin's session
      // is never usable from another site.
      if (originPolicy.wildcard) {
        return callback(null, { origin: '*', credentials: false });
      }

      // A disallowed origin is a client error, not a server fault. Tag it so the
      // shared error handler answers 403 instead of recording a CRITICAL 500.
      const rejection: AppError = new Error(`Origin ${origin} is not allowed by CORS`);
      rejection.statusCode = 403;
      rejection.code = 'CORS_FORBIDDEN';
      return callback(rejection);
    })
  );

  // Request Parsing & Logging
  //
  // JSON only. The urlencoded parser served no client — the site sends JSON — and
  // it is what let a plain HTML form on another site deliver a body this API would
  // parse, with no preflight to stop it.
  app.use(express.json({ limit: '1mb' }));
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
  app.use('/api/v1', rejectCrossSiteWrites(originPolicy));
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
