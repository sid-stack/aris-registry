import crypto from 'node:crypto';

export const requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  next();
};