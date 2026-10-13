import pino from 'pino';

/** Structured JSON logs — Coolify collects stdout. */
export function createLogger(level: string) {
  return pino({
    level,
    base: { service: 'clothhub-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type Logger = ReturnType<typeof createLogger>;
