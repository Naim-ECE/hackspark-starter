const RENTAL_SERVICE_URL = process.env.RENTAL_SERVICE_URL || "http://rental-service:8002";
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:8003";
const GATEWAY_URL_INTERNAL = process.env.GATEWAY_URL_INTERNAL || "http://api-gateway:8000";

export const getGroundingData = async (message) => {
  const lower = message.toLowerCase();

  try {
    // 1. Most rented category
    if (lower.includes("category") && (lower.includes("most") || lower.includes("popular") || lower.includes("top"))) {
      const url = new URL("/central/api/data/rentals/stats", GATEWAY_URL_INTERNAL);
      url.searchParams.set("group_by", "category");
      const response = await fetch(url);
      const data = await response.json();
      return `Here is the data for rental counts by category: ${JSON.stringify(data.data)}`;
    }

    // 2. Product availability
    const productMatch = lower.match(/availability.*product\s+(\d+)/) || lower.match(/product\s+(\d+).*available/);
    if (productMatch) {
      const productId = productMatch[1];
      const from = new Date().toISOString().slice(0, 10);
      const to = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      const url = new URL(`/rentals/products/${productId}/availability`, RENTAL_SERVICE_URL);
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      const response = await fetch(url);
      const data = await response.json();
      return `Availability data for product ${productId} from ${from} to ${to}: ${JSON.stringify(data)}`;
    }

    // 3. Trending / recommended
    if (lower.includes("trending") || lower.includes("recommend") || lower.includes("suggest")) {
      const date = new Date().toISOString().slice(0, 10);
      const url = new URL("/analytics/recommendations", ANALYTICS_SERVICE_URL);
      url.searchParams.set("date", date);
      url.searchParams.set("limit", "5");
      const response = await fetch(url);
      const data = await response.json();
      return `Trending/Recommended products for today (${date}): ${JSON.stringify(data.recommendations)}`;
    }

    // 4. Peak rental period
    if (lower.includes("peak") || lower.includes("busiest")) {
      const url = new URL("/analytics/peak-window", ANALYTICS_SERVICE_URL);
      url.searchParams.set("from", "2024-01");
      url.searchParams.set("to", "2024-06");
      const response = await fetch(url);
      const data = await response.json();
      return `Peak rental window data for 2024 (Jan-Jun): ${JSON.stringify(data.peakWindow)}`;
    }

    // 5. Surge days
    if (lower.includes("surge") || lower.includes("spike")) {
      const month = new Date().toISOString().slice(0, 7);
      const url = new URL("/analytics/surge-days", ANALYTICS_SERVICE_URL);
      url.searchParams.set("month", month);
      const response = await fetch(url);
      const data = await response.json();
      return `Rental surge data for ${month}: ${JSON.stringify(data.data)}`;
    }

    return null;
  } catch (error) {
    console.error("Grounding Error:", error.message);
    return "Error: Could not fetch real-time data for this query.";
  }
};
