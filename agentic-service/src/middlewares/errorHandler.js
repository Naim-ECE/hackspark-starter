export default function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  const payload = {
    error: {
      message,
      status
    }
  };

  if (err.details) {
    payload.error.details = err.details;
  }

  res.status(status).json(payload);
}
