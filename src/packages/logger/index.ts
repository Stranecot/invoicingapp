/**
 * Structured Logging Package
 *
 * This package provides structured logging capabilities using Pino.
 * It supports multiple log levels, automatic filtering of sensitive data,
 * and integration with monitoring tools like Sentry.
 */

import pino from 'pino';
import * as Sentry from '@sentry/nextjs';

/**
 * Log levels
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Sensitive data patterns to filter
 */
const SENSITIVE_PATTERNS = {
  email: /[\w.-]+@[\w.-]+\.\w+/g,
  token: /\b[A-Za-z0-9_-]{32,}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  apiKey: /api[_-]?key[=:]\s*['"]?[a-zA-Z0-9_-]+['"]?/gi,
  password: /password[=:]\s*['"]?[^\s'"]+['"]?/gi,
};

/**
 * Sensitive keys to filter from objects
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'session',
  'csrf',
  'ssn',
  'creditCard',
  'credit_card',
  'privateKey',
  'private_key',
];

/**
 * Filter sensitive data from a value
 */
function filterSensitiveData(value: any): any {
  if (typeof value === 'string') {
    let filtered = value;
    Object.entries(SENSITIVE_PATTERNS).forEach(([key, pattern]) => {
      filtered = filtered.replace(pattern, `[${key.toUpperCase()}]`);
    });
    return filtered;
  }

  if (Array.isArray(value)) {
    return value.map(filterSensitiveData);
  }

  if (value && typeof value === 'object') {
    const filtered: any = {};
    Object.entries(value).forEach(([key, val]) => {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        filtered[key] = '[FILTERED]';
      } else {
        filtered[key] = filterSensitiveData(val);
      }
    });
    return filtered;
  }

  return value;
}

/**
 * Create a logger instance
 */
export function createLogger(options: {
  name?: string;
  level?: LogLevel | string;
  pretty?: boolean;
}) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isServer = typeof window === 'undefined';

  // Client-side logging (browser)
  if (!isServer) {
    return {
      trace: (msg: string, data?: any) => console.debug(`[TRACE] ${msg}`, data),
      debug: (msg: string, data?: any) => console.debug(`[DEBUG] ${msg}`, data),
      info: (msg: string, data?: any) => console.info(`[INFO] ${msg}`, data),
      warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data),
      error: (msg: string, error?: Error | any) => {
        console.error(`[ERROR] ${msg}`, error);
        if (error instanceof Error) {
          Sentry.captureException(error);
        }
      },
      fatal: (msg: string, error?: Error | any) => {
        console.error(`[FATAL] ${msg}`, error);
        if (error instanceof Error) {
          Sentry.captureException(error, { level: 'fatal' });
        }
      },
      child: (bindings: any) => createLogger({ ...options, ...bindings }),
    };
  }

  // Server-side logging (Node.js)
  const pinoOptions: pino.LoggerOptions = {
    name: options.name || 'invoice-app',
    level: options.level || (isDevelopment ? 'debug' : 'info'),

    // Pretty print in development
    transport: options.pretty || isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,

    // Base fields
    base: {
      env: process.env.NODE_ENV,
      app: options.name,
    },

    // Redact sensitive fields
    redact: {
      paths: SENSITIVE_KEYS,
      remove: true,
    },

    // Custom serializers
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },

    // Format logs
    formatters: {
      level: (label) => {
        return { level: label };
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          host: bindings.hostname,
        };
      },
    },

    // Hooks to filter sensitive data
    hooks: {
      logMethod(inputArgs, method) {
        // Filter all arguments for sensitive data
        const filteredArgs = inputArgs.map((arg: any) => {
          if (typeof arg === 'object' && arg !== null) {
            return filterSensitiveData(arg);
          }
          return arg;
        });
        return method.apply(this, filteredArgs);
      },
    },
  };

  const logger = pino(pinoOptions);

  // Wrap error/fatal to also send to Sentry
  const originalError = logger.error.bind(logger);
  const originalFatal = logger.fatal.bind(logger);

  logger.error = (obj: any, msg?: string, ...args: any[]) => {
    if (obj instanceof Error) {
      Sentry.captureException(obj);
    }
    return originalError(obj, msg, ...args);
  };

  logger.fatal = (obj: any, msg?: string, ...args: any[]) => {
    if (obj instanceof Error) {
      Sentry.captureException(obj, { level: 'fatal' });
    }
    return originalFatal(obj, msg, ...args);
  };

  return logger;
}

/**
 * Default logger instance
 */
export const logger = createLogger({
  name: 'invoice-app',
  level: process.env.LOG_LEVEL || LogLevel.INFO,
});

/**
 * Create a child logger with additional context
 */
export function getLogger(context: string | { [key: string]: any }) {
  if (typeof context === 'string') {
    return logger.child({ context });
  }
  return logger.child(context);
}

/**
 * Express/Next.js middleware for request logging
 */
export function requestLogger(options?: {
  excludePaths?: string[];
  includeBody?: boolean;
}) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const reqLogger = logger.child({
      requestId: req.headers['x-request-id'] || Math.random().toString(36).substring(7),
      method: req.method,
      path: req.url,
      ip: req.ip || req.connection.remoteAddress,
    });

    // Skip logging for excluded paths
    if (options?.excludePaths?.some(path => req.url.startsWith(path))) {
      return next();
    }

    // Log request
    reqLogger.info({
      type: 'request',
      headers: filterSensitiveData(req.headers),
      query: filterSensitiveData(req.query),
      body: options?.includeBody ? filterSensitiveData(req.body) : undefined,
    }, 'Incoming request');

    // Log response
    const originalSend = res.send;
    res.send = function (body: any) {
      const duration = Date.now() - start;
      reqLogger.info({
        type: 'response',
        statusCode: res.statusCode,
        duration,
      }, 'Request completed');
      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * API route helper for structured logging
 */
export function withLogging<T extends (...args: any[]) => any>(
  handler: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    const routeLogger = context ? getLogger(context) : logger;
    const start = Date.now();

    try {
      routeLogger.info('API route called');
      const result = await handler(...args);
      const duration = Date.now() - start;
      routeLogger.info({ duration }, 'API route completed');
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      routeLogger.error({ error, duration }, 'API route failed');
      throw error;
    }
  }) as T;
}

// Export types
export type Logger = ReturnType<typeof createLogger>;

export default logger;
