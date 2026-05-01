/**
 * Return service status for health checks.
 * @returns {Promise<object>} status payload
 */
export const fetchStatus = async () => ({
  service: "agentic-service",
  status: "OK"
});
