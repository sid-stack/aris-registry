import { logger, requestMeta } from "../utils/logger.js";

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  logger.error(
    "request_failed",
    requestMeta(req, {
      status: statusCode,
      error_name: err.name,
      error_message: err.message,
      stack: err.stack,
    })
  );
  
  res.status(statusCode);
  res.json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};
