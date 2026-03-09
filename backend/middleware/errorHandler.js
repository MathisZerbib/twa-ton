/**
 * middleware/errorHandler.js
 *
 * Central error handler — catches all errors passed via next(err).
 * Logs full error in dev, returns a clean JSON response.
 */

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[Error] ${req.method} ${req.originalUrl} →`, err.message);
  if (isDev) console.error(err.stack);

  res.status(status).json({
    error: isDev ? err.message : 'Internal server error',
  });
}

module.exports = errorHandler;
