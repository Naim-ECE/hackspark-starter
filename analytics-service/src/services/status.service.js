/**
 * Return service status for health checks.
 * @returns {Promise<object>} status payload
 */
export const fetchStatus = async () => ({
  service: "analytics-service",
  status: "OK"
});
