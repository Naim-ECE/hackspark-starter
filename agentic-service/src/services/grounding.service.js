/**
 * Grounding Service
 *
 * Fetches real-time context data from the Central API and internal services
 * to ground the LLM's responses in actual RentPi data.
 *
 * IMPORTANT: We call the Central API directly (not via gateway) to avoid
 * consuming the shared 30 req/min rate-limit counter used by other services.
 */

const CENTRAL_API_URL = process.env.CENTRAL_API_URL || "";
const CENTRAL_API_TOKEN = process.env.CENTRAL_API_TOKEN || "";
const RENTAL_SERVICE_URL =
  process.env.RENTAL_SERVICE_URL || "http://rental-service:8002";
const GATEWAY_URL_INTERNAL =
  process.env.GATEWAY_URL_INTERNAL || "http://api-gateway:8000";

/**
 * Direct fetch to Central API — bypasses gateway rate-limit counter.
 */
const fetchCentralDirect = async (path, params = {}) => {
  if (!CENTRAL_API_URL || !CENTRAL_API_TOKEN) return null;
  const url = new URL(path, CENTRAL_API_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${CENTRAL_API_TOKEN}` }
  });
  if (!response.ok) return null;
  return response.json();
};

/**
 * Fetch from an internal service (rental-service, api-gateway etc.)
 */
const fetchInternal = async (baseUrl, path, params = {}) => {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
};

export const getGroundingData = async (message) => {
  const lower = message.toLowerCase();

  try {
    // 1. Popular / most-rented categories — call Central API directly
    if (
      lower.includes("categor") &&
      (lower.includes("most") ||
        lower.includes("popular") ||
        lower.includes("top"))
    ) {
      const data = await fetchCentralDirect("/api/data/rentals/stats", {
        group_by: "category"
      });
      if (data?.data) {
        const top = data.data.slice(0, 5);
        return `Top rental categories by rental count: ${JSON.stringify(top)}`;
      }
    }

    // 2. Product availability
    const productMatch =
      lower.match(/availability.*product\s+(\d+)/) ||
      lower.match(/product\s+(\d+).*avail/);
    if (productMatch) {
      const productId = productMatch[1];
      const from = new Date().toISOString().slice(0, 10);
      const to = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      const data = await fetchInternal(
        RENTAL_SERVICE_URL,
        `/rentals/products/${productId}/availability`,
        { from, to }
      );
      if (data) {
        return `Availability for product ${productId} (${from} → ${to}): ${JSON.stringify(data)}`;
      }
    }

    // 3. Product listing / browse products
    if (
      lower.includes("product") &&
      (lower.includes("list") ||
        lower.includes("show") ||
        lower.includes("what") ||
        lower.includes("browse") ||
        lower.includes("available"))
    ) {
      const data = await fetchCentralDirect("/api/data/products", {
        page: 1,
        limit: 8
      });
      if (data?.data) {
        return `Available products on RentPi (sample): ${JSON.stringify(data.data)}`;
      }
    }

    // 4. Peak rental period
    if (lower.includes("peak") || lower.includes("busiest")) {
      const data = await fetchInternal(
        GATEWAY_URL_INTERNAL,
        "/analytics/peak-window",
        { from: "2024-01", to: "2024-06" }
      );
      if (data?.peakWindow) {
        return `Peak rental window for 2024 (Jan–Jun): ${JSON.stringify(data.peakWindow)}`;
      }
    }

    // 5. Surge days
    if (lower.includes("surge") || lower.includes("spike")) {
      const month = new Date().toISOString().slice(0, 7);
      const data = await fetchInternal(
        GATEWAY_URL_INTERNAL,
        "/analytics/surge-days",
        { month }
      );
      if (data?.data) {
        const surges = data.data.filter((d) => d.nextSurgeDate !== null).slice(0, 5);
        return `Rental surge data for ${month} (days with upcoming higher-demand): ${JSON.stringify(surges)}`;
      }
    }

    // 6. Trending / recommended
    if (
      lower.includes("trending") ||
      lower.includes("recommend") ||
      lower.includes("suggest")
    ) {
      // Fetch top categories as a lightweight proxy for trending
      const data = await fetchCentralDirect("/api/data/rentals/stats", {
        group_by: "category"
      });
      if (data?.data) {
        const top = data.data.slice(0, 5);
        return `Currently trending rental categories (by rental count): ${JSON.stringify(top)}`;
      }
    }

    // 7. Pricing / price related
    if (lower.includes("price") || lower.includes("cost") || lower.includes("cheap")) {
      const data = await fetchCentralDirect("/api/data/products", {
        page: 1,
        limit: 10
      });
      if (data?.data) {
        const sorted = [...data.data].sort((a, b) => a.pricePerDay - b.pricePerDay);
        return `Products by price per day (cheapest first): ${JSON.stringify(sorted.slice(0, 5))}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Grounding Error:", error.message);
    return null; // Return null so LLM still responds with its own knowledge
  }
};
