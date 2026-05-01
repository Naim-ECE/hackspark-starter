const requireBaseUrl = (baseUrl) => {
  if (!baseUrl) {
    const err = new Error("Upstream service is not configured");
    err.status = 500;
    throw err;
  }
};

const buildUrl = (baseUrl, path, query) => {
  const url = new URL(path, baseUrl);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url;
};

export const mapProduct = (product = {}) => ({
  id: product.id,
  name: product.name || product.title || "",
  pricePerDay: product.pricePerDay ?? product.price ?? null,
  category: product.category || "",
  description: product.description || "",
  image: product.image ?? null,
  ownerId: product.ownerId
});

export const normalizeProductsList = (payload = {}) => ({
  ...payload,
  data: Array.isArray(payload.data) ? payload.data.map(mapProduct) : []
});

export const normalizeProduct = (payload = {}) => mapProduct(payload);

export const normalizeRecommendations = (payload = {}) => {
  if (Array.isArray(payload.recommendations)) {
    return payload;
  }
  if (Array.isArray(payload.items)) {
    return { recommendations: payload.items };
  }
  return { recommendations: [] };
};

export const normalizeChatReply = (payload = {}) => {
  if (payload.reply) {
    return payload;
  }
  if (payload.text) {
    return { reply: { role: "assistant", text: payload.text } };
  }
  return { reply: { role: "assistant", text: "" } };
};

export const forwardRequest = async ({
  baseUrl,
  path,
  method,
  headers,
  query,
  body
}) => {
  requireBaseUrl(baseUrl);

  const url = buildUrl(baseUrl, path, query);
  const init = {
    method,
    headers: {
      ...(headers.authorization ? { Authorization: headers.authorization } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    }
  };

  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const rawText = await response.text();
  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.message || data?.error || "Upstream error";
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
};
