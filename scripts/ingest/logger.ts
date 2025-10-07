const LOG_PREFIX = '[ingest]';

const level = (process.env.INGEST_LOG_LEVEL || '').toLowerCase();
const debugFlag =
  level === 'debug' ||
  ['true', '1', 'yes'].includes((process.env.INGEST_DEBUG || '').toLowerCase());
const format = (process.env.INGEST_LOG_FORMAT || '').toLowerCase();
const jsonFormat = format === 'json';

const emit = (severity: string, message: string, meta?: Record<string, unknown>) => {
  if (jsonFormat) {
    const payload = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    console.log(JSON.stringify(payload));
  } else {
    if (meta) {
      console.log(LOG_PREFIX, `[${severity}]`, message, meta);
    } else {
      console.log(LOG_PREFIX, `[${severity}]`, message);
    }
  }
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  if (!debugFlag) {
    return;
  }
  emit('debug', message, meta);
};

export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  emit('info', message, meta);
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
  emit('warn', message, meta);
};

export const logError = (message: string, meta?: Record<string, unknown>) => {
  emit('error', message, meta);
};
