import { db } from "../utils/db.js";

/**
 * Middleware to verify the access key or Supabase token.
 * This ensures the dashboard remains protected and "institutional".
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const accessKey = req.headers["x-access-key"] || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  // If provided, check against the master access key from .env
  if (accessKey === process.env.VITE_ACCESS_KEY) {
    req.user = { id: "institutional-admin", email: "admin@aris.core", role: "admin" };
    return next();
  }

  // Fallback to error if neither is valid for now (Supabase Auth proxy can be added here)
  if (!accessKey) {
    return res.status(401).json({ 
      error: "Authentication required", 
      message: "Please provide a valid institutional access key or sign in." 
    });
  }

  res.status(403).json({ error: "Invalid access key" });
};
