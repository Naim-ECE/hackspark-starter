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
 * @param {object} params
 * @returns {Promise<object>} response payload
 */
export const fetchCentral = async (path, params = {}) => {
  ensureGatewayConfig();
  const url = new URL(`/central${path}`, GATEWAY_URL);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

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
 * Fetch valid categories from the Central API.
 * @returns {Promise<string[]>} categories
 */
export const fetchCategories = async () => {
  const data = await fetchCentral("/api/data/categories");
  return data.categories || [];
};

/**
 * Fetch products list from the Central API.
 * @param {object} params
 * @returns {Promise<object>} products payload
 */
export const fetchProducts = async (params) => fetchCentral("/api/data/products", params);

/**
 * Fetch product by id from the Central API.
 * @param {string|number} id
 * @returns {Promise<object>} product payload
 */
export const fetchProductById = async (id) => fetchCentral(`/api/data/products/${id}`);

/**
 * Fetch rentals list from the Central API.
 * @param {object} params
 * @returns {Promise<object>} rentals payload
 */
export const fetchRentals = async (params) => fetchCentral("/api/data/rentals", params);

/**
 * Fetch products batch from the Central API.
 * @param {string} ids
 * @returns {Promise<object>} products payload
 */
export const fetchProductsBatch = async (ids) =>
  fetchCentral("/api/data/products/batch", { ids });

/**
 * Fetch rental stats from the Central API.
 * @param {object} params
 * @returns {Promise<object[]>} stats data
 */
export const fetchRentalStats = async (params) => {
  const data = await fetchCentral("/api/data/rentals/stats", params);
  return data.data || [];
};
