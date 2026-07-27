import type { AuthenticatedContext } from '../shared/request-context.js';
import type { DatabaseClient } from '../config/supabase.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedContext;
      databaseClient?: DatabaseClient;
      validated?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};
