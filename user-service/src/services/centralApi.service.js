const GATEWAY_URL = process.env.GATEWAY_URL_INTERNAL || "";

const ensureGatewayConfig = () => {
  if (!GATEWAY_URL) {
    const err = new Error("Gateway URL is not configured");
    err.status = 500;
    throw err;
  }
};

/**
 * Fetch data through the API gateway central proxy.
 * @param {string} path
 * @returns {Promise<object>} response payload
 */
export const fetchCentral = async (path) => {
  ensureGatewayConfig();
  const url = new URL(`/central${path}`, GATEWAY_URL);
  const response = await fetch(url);
  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    const message = data?.error?.message || data?.message || "Upstream error";
    const err = new Error(message);
    err.status = response.status;
    err.details = data?.error?.details;
    throw err;
  }

  return data;
};

/**
 * Fetch user by id from the Central API.
 * @param {string|number} id
 * @returns {Promise<object>} user payload
 */
export const fetchCentralUser = async (id) => fetchCentral(`/api/data/users/${id}`);
