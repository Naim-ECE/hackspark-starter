const SERVICES = [
  { name: "user-service", url: process.env.USER_SERVICE_URL },
  { name: "rental-service", url: process.env.RENTAL_SERVICE_URL },
  { name: "analytics-service", url: process.env.ANALYTICS_SERVICE_URL },
  { name: "agentic-service", url: process.env.AGENTIC_SERVICE_URL }
];

/**
 * Fetch health checks from downstream services in parallel.
 * @returns {Promise<object>} map of service name to status
 */
export const fetchDownstreamStatuses = async () => {
  const checks = SERVICES.map(async (service) => {
    if (!service.url) {
      return { name: service.name, status: "UNREACHABLE" };
    }

    try {
      const response = await fetch(`${service.url}/status`);
      if (!response.ok) {
        return { name: service.name, status: "UNREACHABLE" };
      }
      const body = await response.json();
      const status = typeof body.status === "string" ? body.status : "UNREACHABLE";
      return { name: service.name, status };
    } catch {
      return { name: service.name, status: "UNREACHABLE" };
    }
  });

  const results = await Promise.all(checks);
  return results.reduce((acc, item) => {
    acc[item.name] = item.status;
    return acc;
  }, {});
};
