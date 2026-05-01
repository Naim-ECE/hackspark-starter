import cache from "../utils/cache.js";
import {
  fetchCategories,
  fetchProducts,
  fetchProductById,
  fetchRentals,
  fetchProductsBatch,
  fetchRentalStats
} from "./centralApi.service.js";

const CATEGORY_CACHE_KEY = "central:categories";
const CATEGORY_TTL_SECONDS = 55;

/**
 * Aggregate service status for health checks.
 * @returns {Promise<object>} status payload
 */
export const fetchStatus = async () => ({
  service: "rental-service",
  status: "OK"
});

/**
 * Load valid categories and cache them.
 * @returns {Promise<string[]>} categories
 */
export const getCachedCategories = async () => {
  const cached = cache.get(CATEGORY_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const categories = await fetchCategories();
  cache.set(CATEGORY_CACHE_KEY, categories, CATEGORY_TTL_SECONDS);
  return categories;
};

const isValidYYYYMM = (str) => /^\d{4}-(0[1-9]|1[0-2])$/.test(str);

const getMonthsBetween = (from, to) => {
  const start = new Date(`${from}-01`);
  const end = new Date(`${to}-01`);
  const months = [];
  const current = new Date(start);
  while (current <= end) {
    months.push(current.toISOString().slice(0, 7));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

/**
 * Find the Kth busiest date in a range.
 * @param {string} from
 * @param {string} to
 * @param {string|number} k
 * @returns {Promise<object>} kth busiest payload
 */
export const getKthBusiestDate = async (from, to, k) => {
  if (!isValidYYYYMM(from) || !isValidYYYYMM(to)) {
    const err = new Error("from and to must be valid YYYY-MM");
    err.status = 400;
    throw err;
  }

  const kInt = Number(k);
  if (!Number.isInteger(kInt) || kInt <= 0) {
    const err = new Error("k must be a positive integer");
    err.status = 400;
    throw err;
  }

  const start = new Date(`${from}-01`);
  const end = new Date(`${to}-01`);
  if (start > end) {
    const err = new Error("from must not be after to");
    err.status = 400;
    throw err;
  }

  const months = getMonthsBetween(from, to);
  if (months.length > 12) {
    const err = new Error("range must be within 12 months");
    err.status = 400;
    throw err;
  }

  const allStats = [];
  for (const month of months) {
    const stats = await fetchRentalStats({ group_by: "date", month });
    allStats.push(...stats);
  }

  if (kInt > allStats.length) {
    const err = new Error("k exceeds the total number of distinct dates available");
    err.status = 404;
    throw err;
  }

  // Optimized approach: Min-Heap of size K to find the Kth largest
  // We use a simple array and sort it for small K, or a proper heap for large K.
  // Given N is small (max 366 days), we can just sort, but let's be "optimized" as requested.
  const heap = [];
  for (const item of allStats) {
    if (heap.length < kInt) {
      heap.push(item);
      if (heap.length === kInt) {
        heap.sort((a, b) => a.count - b.count);
      }
    } else if (item.count > heap[0].count) {
      heap[0] = item;
      heap.sort((a, b) => a.count - b.count);
    }
  }

  const result = heap[0];
  return {
    from,
    to,
    k: kInt,
    date: result.date,
    rentalCount: result.count
  };
};

/**
 * Validate category and fetch products list.
 * @param {object} params
 * @returns {Promise<object>} products payload
 */
export const listProducts = async (params) => {
  const { category } = params;
  if (category) {
    const categories = await getCachedCategories();
    const isValid = categories.includes(category);
    if (!isValid) {
      const err = new Error(`Invalid category. Valid options: ${categories.join(", ")}`);
      err.status = 400;
      throw err;
    }
  }

  return fetchProducts(params);
};

/**
 * Fetch a single product by id.
 * @param {string|number} id
 * @returns {Promise<object>} product payload
 */
export const getProduct = async (id) => fetchProductById(id);

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateString = (date) => date.toISOString().slice(0, 10);

const mergeIntervals = (intervals) => {
  if (!intervals.length) return [];
  const sorted = intervals.sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.start <= last.end) {
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
    } else {
      merged.push(current);
    }
  }

  return merged;
};

const collectRentals = async (params) => {
  let page = 1;
  const limit = 100;
  const rentals = [];

  while (true) {
    const payload = await fetchRentals({ ...params, page, limit });
    rentals.push(...(payload.data || []));
    if (!payload.total || page * limit >= payload.total) {
      break;
    }
    page += 1;
  }

  return rentals;
};

/**
 * Determine availability for a product within date range.
 * @param {string|number} productId
 * @param {string} from
 * @param {string} to
 * @returns {Promise<object>} availability payload
 */
export const getAvailability = async (productId, from, to) => {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);

  if (!fromDate || !toDate || fromDate > toDate) {
    const err = new Error("from and to must be valid dates");
    err.status = 400;
    throw err;
  }

  const rentals = await collectRentals({ product_id: productId, from, to });
  const intervals = rentals.map((rental) => ({
    start: new Date(rental.rentalStart),
    end: new Date(rental.rentalEnd)
  }));

  const merged = mergeIntervals(intervals);
  const busyPeriods = merged.map((interval) => ({
    start: toDateString(interval.start),
    end: toDateString(interval.end)
  }));

  const freeWindows = [];
  let cursor = fromDate;
  for (const interval of merged) {
    if (cursor < interval.start) {
      freeWindows.push({
        start: toDateString(cursor),
        end: toDateString(new Date(interval.start.getTime() - 86400000))
      });
    }
    const nextCursor = new Date(interval.end.getTime() + 86400000);
    if (nextCursor > cursor) {
      cursor = nextCursor;
    }
  }

  if (cursor <= toDate) {
    freeWindows.push({
      start: toDateString(cursor),
      end: toDateString(toDate)
    });
  }

  const overlaps = merged.some(
    (interval) => interval.start <= toDate && interval.end >= fromDate
  );

  return {
    productId,
    from: toDateString(fromDate),
    to: toDateString(toDate),
    available: !overlaps,
    busyPeriods,
    freeWindows
  };
};

/**
 * Find the longest free streak for a product in a year.
 * @param {string|number} productId
 * @param {string|number} year
 * @returns {Promise<object>} longest free streak payload
 */
export const getLongestFreeStreak = async (productId, year) => {
  const yearInt = Number(year);
  if (!Number.isInteger(yearInt) || yearInt < 2000 || yearInt > 2100) {
    const err = new Error("year must be a valid year");
    err.status = 400;
    throw err;
  }

  const yearStart = new Date(`${yearInt}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${yearInt}-12-31T23:59:59Z`);

  const rentals = await collectRentals({
    product_id: productId,
    from: `${yearInt}-01-01`,
    to: `${yearInt}-12-31`
  });

  const intervals = rentals
    .map((rental) => ({
      start: new Date(rental.rentalStart),
      end: new Date(rental.rentalEnd)
    }))
    .filter((interval) => interval.start <= yearEnd && interval.end >= yearStart)
    .map((interval) => ({
      start: new Date(Math.max(interval.start.getTime(), yearStart.getTime())),
      end: new Date(Math.min(interval.end.getTime(), yearEnd.getTime()))
    }));

  const merged = mergeIntervals(intervals);

  let longestStreak = {
    from: toDateString(yearStart),
    to: toDateString(yearEnd),
    days: 0
  };

  const gaps = [];
  let cursor = yearStart;

  for (const interval of merged) {
    if (cursor < interval.start) {
      gaps.push({
        start: new Date(cursor),
        end: new Date(interval.start.getTime() - 86400000)
      });
    }
    const nextCursor = new Date(interval.end.getTime() + 86400000);
    if (nextCursor > cursor) {
      cursor = nextCursor;
    }
  }

  if (cursor <= yearEnd) {
    gaps.push({
      start: new Date(cursor),
      end: new Date(yearEnd)
    });
  }

  let maxDays = -1;
  for (const gap of gaps) {
    const diffTime = Math.abs(gap.end.getTime() - gap.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > maxDays) {
      maxDays = diffDays;
      longestStreak = {
        from: toDateString(gap.start),
        to: toDateString(gap.end),
        days: diffDays
      };
    }
  }

  // If no rentals at all, the whole year is free
  if (merged.length === 0) {
    const totalDays = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    longestStreak = {
      from: toDateString(yearStart),
      to: toDateString(yearEnd),
      days: totalDays
    };
  }

  return {
    productId,
    year: yearInt,
    longestFreeStreak: longestStreak
  };
};

/**
 * Merge rental feeds from multiple products.
 * @param {string} productIdsStr
 * @param {string|number} limit
 * @returns {Promise<object>} merged feed payload
 */
export const getMergedFeed = async (productIdsStr, limit) => {
  if (!productIdsStr) {
    const err = new Error("productIds are required");
    err.status = 400;
    throw err;
  }

  const productIds = [...new Set(productIdsStr.split(",").map((id) => Number(id.trim())))];
  if (productIds.some((id) => !Number.isInteger(id)) || productIds.length === 0 || productIds.length > 10) {
    const err = new Error("productIds must be 1–10 comma-separated integers");
    err.status = 400;
    throw err;
  }

  const limitInt = Number(limit) || 30;
  if (!Number.isInteger(limitInt) || limitInt <= 0 || limitInt > 100) {
    const err = new Error("limit must be a positive integer, max 100");
    err.status = 400;
    throw err;
  }

  // Fetch all rentals for each product in parallel
  const feeds = await Promise.all(
    productIds.map(async (productId) => {
      const rentals = await collectRentals({ product_id: productId });
      return rentals.map((r) => ({
        rentalId: r.id,
        productId: r.productId,
        rentalStart: toDateString(new Date(r.rentalStart)),
        rentalEnd: toDateString(new Date(r.rentalEnd))
      }));
    })
  );

  // K-way merge (simplified since total items are small, or use proper Min-Heap for scale)
  const merged = [];
  const indices = new Array(feeds.length).fill(0);

  while (merged.length < limitInt) {
    let bestVal = null;
    let bestIdx = -1;

    for (let i = 0; i < feeds.length; i += 1) {
      if (indices[i] < feeds[i].length) {
        const current = feeds[i][indices[i]];
        if (bestVal === null || current.rentalStart < bestVal) {
          bestVal = current.rentalStart;
          bestIdx = i;
        }
      }
    }

    if (bestIdx === -1) break;
    merged.push(feeds[bestIdx][indices[bestIdx]]);
    indices[bestIdx] += 1;
  }

  return {
    productIds,
    limit: limitInt,
    feed: merged
  };
};

const ensurePositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const topKFromMap = (countMap, k) => {
  const heap = [];
  for (const [category, rentalCount] of countMap.entries()) {
    if (heap.length < k) {
      heap.push({ category, rentalCount });
      heap.sort((a, b) => a.rentalCount - b.rentalCount);
    } else if (rentalCount > heap[0].rentalCount) {
      heap[0] = { category, rentalCount };
      heap.sort((a, b) => a.rentalCount - b.rentalCount);
    }
  }
  return heap.sort((a, b) => b.rentalCount - a.rentalCount);
};

/**
 * Get top categories for a renter.
 * @param {string|number} renterId
 * @param {string|number} k
 * @returns {Promise<object>} top categories payload
 */
export const getTopCategories = async (renterId, k) => {
  let limit = 5;
  if (k !== undefined && k !== null && k !== "") {
    const parsed = ensurePositiveInt(k);
    if (!parsed) {
      const err = new Error("k must be a positive integer");
      err.status = 400;
      throw err;
    }
    limit = parsed;
  }
  const rentals = await collectRentals({ renter_id: renterId });
  if (!rentals.length) {
    return { userId: renterId, topCategories: [] };
  }

  const productIds = [...new Set(rentals.map((rental) => rental.productId))];
  const productMap = new Map();

  for (let i = 0; i < productIds.length; i += 50) {
    const chunk = productIds.slice(i, i + 50);
    const payload = await fetchProductsBatch(chunk.join(","));
    (payload.data || []).forEach((product) => {
      productMap.set(product.id, product);
    });
  }

  const counts = new Map();
  rentals.forEach((rental) => {
    const product = productMap.get(rental.productId);
    if (!product) return;
    const category = product.category;
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const top = topKFromMap(counts, limit);
  return { userId: renterId, topCategories: top };
};
