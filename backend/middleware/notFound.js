/**
 * middleware/notFound.js
 *
 * Catches any route that wasn't matched and returns a clean 404 JSON.
 */

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = notFound;
