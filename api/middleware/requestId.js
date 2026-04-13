import crypto from 'node:crypto';
import { logger, requestMeta } from "../utils/logger.js";

export const requestId = (req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
};

export const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    if (!req.originalUrl?.startsWith("/api/")) return;

    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    logger.info(
      "request_complete",
      requestMeta(req, {
        status: res.statusCode,
        duration_ms: Number(durationMs.toFixed(1)),
        ip: req.ip,
      })
    );
  });

  next();
};
