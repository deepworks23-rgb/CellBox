import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiApp } from '../src/server/app.ts';

const app = createApiApp();

/**
 * Vercel Serverless Function entrypoint.
 * Normalizes req.url so both direct `/api/*` paths and Vercel rewrite destinations
 * (`/api?__cellbox_path=...`) route cleanly into the Express API handlers.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const rewrittenPath = parsed.searchParams.get('__cellbox_path');
      if (rewrittenPath !== null) {
        parsed.searchParams.delete('__cellbox_path');
        const cleanedPath = rewrittenPath.replace(/^\/+/, '');
        const remainingQuery = parsed.searchParams.toString();
        req.url = `/api/${cleanedPath}${remainingQuery ? `?${remainingQuery}` : ''}`;
      }
    } catch {
      // Keep original req.url if URL parsing fails
    }
  }

  return app(req, res);
}
