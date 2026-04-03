const LEVEL_PRIORITY = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const DEFAULT_LEVEL = process.env.LOG_LEVEL?.toLowerCase() ||
  (process.env.NODE_ENV === "development" ? "debug" : "info");

function shouldLog(level) {
  const current = LEVEL_PRIORITY[DEFAULT_LEVEL] ?? LEVEL_PRIORITY.info;
  const target = LEVEL_PRIORITY[level] ?? LEVEL_PRIORITY.info;
  return target <= current;
}

function normalizeValue(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, normalizeValue(entryValue)])
    );
  }

  return value;
}

function write(level, message, meta = {}) {
  if (!shouldLog(level)) return;

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...normalizeValue(meta),
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  error(message, meta) {
    write("error", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  info(message, meta) {
    write("info", message, meta);
  },
  debug(message, meta) {
    write("debug", message, meta);
  },
};

export function requestMeta(req, extra = {}) {
  return {
    request_id: req?.id,
    method: req?.method,
    path: req?.originalUrl || req?.url,
    ...extra,
  };
}
