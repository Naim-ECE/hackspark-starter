import axios from "axios";
import axiosRetry from "axios-retry";
import cache from "../utils/cache.js";

const BASE_URL = process.env.CENTRAL_API_URL || "";
const TOKEN = process.env.CENTRAL_API_TOKEN || "";
const CACHE_TTL_SECONDS = 55;
const RATE_LIMIT = 30;
const WINDOW_MS = 60 * 1000;
const RATE_LIMIT_KEY = "central:rate";

const ensureCentralConfig = () => {
  if (!BASE_URL || !TOKEN) {
    const err = new Error("Central API configuration missing");
    err.status = 500;
    throw err;
  }
};

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${TOKEN}`
  }
});

const enforceRateLimit = () => {
  const now = Date.now();
  const entry = cache.get(RATE_LIMIT_KEY);
  if (!entry || now - entry.start > WINDOW_MS) {
    cache.set(RATE_LIMIT_KEY, { count: 1, start: now }, 60);
    return;
  }

  if (entry.count >= RATE_LIMIT) {
    const err = new Error("Central API rate limit guard: try again later");
    err.status = 429;
    throw err;
  }

  cache.set(RATE_LIMIT_KEY, { count: entry.count + 1, start: entry.start }, 60);
};

client.interceptors.request.use((config) => {
  enforceRateLimit();
  return config;
});

axiosRetry(client, {
  retries: 3,
  retryCondition: (error) => error?.response?.status === 429,
  retryDelay: (retryCount, error) => {
    const retryAfter = error?.response?.data?.retryAfterSeconds;
    const base = Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000;
    const exponential = base * Math.pow(2, retryCount - 1);
    const jitter = exponential * (Math.random() * 0.4 - 0.2);
    const delayMs = Math.max(0, Math.floor(exponential + jitter));
    // eslint-disable-next-line no-console
    console.log(
      `[retry ${retryCount}/3] waiting ${Math.ceil(delayMs / 1000)}s before retrying ${error?.config?.method?.toUpperCase()} ${error?.config?.url}`
    );
    return delayMs;
  }
});

const getCacheKey = (path, params) => {
  const query = params ? JSON.stringify(params) : "";
  return `central:${path}:${query}`;
};

/**
 * Fetch data from the Central API with caching and retries.
 * @param {string} path
 * @param {object} params
 * @returns {Promise<object>} response payload
 */
export const fetchCentral = async (path, params = {}) => {
  ensureCentralConfig();
  const cacheKey = getCacheKey(path, params);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await client.get(path, { params });
    cache.set(cacheKey, response.data, CACHE_TTL_SECONDS);
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 429) {
      const retryAfter = error?.response?.data?.retryAfterSeconds || 0;
      const err = new Error("Central API unavailable after 3 retries");
      err.status = 503;
      err.details = {
        lastRetryAfter: retryAfter,
        suggestion: "Try again in ~2 minutes"
      };
      throw err;
    }

    const message = error?.response?.data?.error || "Central API error";
    const err = new Error(message);
    err.status = status || 502;
    throw err;
  }
};
