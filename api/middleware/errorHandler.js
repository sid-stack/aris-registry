import { failResponse } from "../utils/response.js";

export function notFoundHandler(req, res) {
  res.status(404).json(failResponse("not_found", `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  const requestId = req.id || "unknown";
  const status = err.status || err.statusCode || 500;
  const code = err.code || "internal_error";
  const message = err.message || "Unexpected error";

  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      route: req.originalUrl,
      method: req.method,
      status,
      code,
      message,
    }),
  );

  res.status(status).json(failResponse(code, message));
}
