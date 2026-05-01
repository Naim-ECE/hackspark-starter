import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { fetchDailyStats, fetchRentals, fetchProductsBatch } from "./centralApi.service.js";

dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

const isValidMonth = (value) => dayjs(value, "YYYY-MM", true).isValid();
const isValidDate = (value) => dayjs(value, "YYYY-MM-DD", true).isValid();

const getMonthRange = (from, to) => {
  const start = dayjs(`${from}-01`);
  const end = dayjs(`${to}-01`);
  const months = [];
  let cursor = start;
  while (cursor.isSameOrBefore(end)) {
    months.push(cursor.format("YYYY-MM"));
    cursor = cursor.add(1, "month");
  }
  return months;
};

const buildDailySeries = async (from, to) => {
  const months = getMonthRange(from, to);
  const statsByDate = new Map();

  for (const month of months) {
    const dailyStats = await fetchDailyStats(month);
    dailyStats.forEach((item) => {
      // Normalize ISO timestamp (e.g. '2024-01-01T00:00:00.000Z') to 'YYYY-MM-DD'
      const dateKey = dayjs(item.date).format("YYYY-MM-DD");
      statsByDate.set(dateKey, item.count);
    });
  }

  const start = dayjs(`${from}-01`);
  const end = dayjs(`${to}-01`).endOf("month");
  const series = [];

  let cursor = start;
  while (cursor.isSameOrBefore(end)) {
    const date = cursor.format("YYYY-MM-DD");
    series.push({
      date,
      count: statsByDate.get(date) || 0
    });
    cursor = cursor.add(1, "day");
  }

  return series;
};

/**
 * Find the highest 7-day window in a date range.
 * @param {string} from
 * @param {string} to
 * @returns {Promise<object>} peak window payload
 */
export const getPeakWindow = async (from, to) => {
  if (!isValidMonth(from) || !isValidMonth(to)) {
    const err = new Error("from and to must be valid YYYY-MM");
    err.status = 400;
    throw err;
  }

  const start = dayjs(`${from}-01`);
  const end = dayjs(`${to}-01`);
  if (start.isAfter(end)) {
    const err = new Error("from must not be after to");
    err.status = 400;
    throw err;
  }

  if (end.diff(start, "month") > 11) {
    const err = new Error("range must be within 12 months");
    err.status = 400;
    throw err;
  }

  const series = await buildDailySeries(from, to);
  if (series.length < 7) {
    const err = new Error("not enough days for 7-day window");
    err.status = 400;
    throw err;
  }

  let windowSum = 0;
  for (let i = 0; i < 7; i += 1) {
    windowSum += series[i].count;
  }

  let bestSum = windowSum;
  let bestStartIndex = 0;

  for (let i = 7; i < series.length; i += 1) {
    windowSum += series[i].count - series[i - 7].count;
    if (windowSum > bestSum) {
      bestSum = windowSum;
      bestStartIndex = i - 6;
    }
  }

  const bestStart = series[bestStartIndex].date;
  const bestEnd = series[bestStartIndex + 6].date;

  return {
    from,
    to,
    peakWindow: {
      from: bestStart,
      to: bestEnd,
      totalRentals: bestSum
    }
  };
};

const buildMonthSeries = async (month) => {
  const dailyStats = await fetchDailyStats(month);
  const statsByDate = new Map();
  dailyStats.forEach((item) => {
    // Normalize ISO timestamp (e.g. '2024-01-01T00:00:00.000Z') to 'YYYY-MM-DD'
    const dateKey = dayjs(item.date).format("YYYY-MM-DD");
    statsByDate.set(dateKey, item.count);
  });

  const start = dayjs(`${month}-01`);
  const end = start.endOf("month");
  const series = [];

  let cursor = start;
  while (cursor.isSameOrBefore(end)) {
    const date = cursor.format("YYYY-MM-DD");
    series.push({
      date,
      count: statsByDate.get(date) || 0
    });
    cursor = cursor.add(1, "day");
  }

  return series;
};

/**
 * Find next higher surge day for each date in month.
 * @param {string} month
 * @returns {Promise<object>} surge payload
 */
export const getSurgeDays = async (month) => {
  if (!isValidMonth(month)) {
    const err = new Error("month must be valid YYYY-MM");
    err.status = 400;
    throw err;
  }

  const series = await buildMonthSeries(month);
  const result = new Array(series.length).fill(null);
  const stack = [];

  for (let i = 0; i < series.length; i += 1) {
    const current = series[i];
    while (stack.length && series[stack[stack.length - 1]].count < current.count) {
      const idx = stack.pop();
      const prev = series[idx];
      result[idx] = {
        date: prev.date,
        count: prev.count,
        nextSurgeDate: current.date,
        daysUntil: dayjs(current.date).diff(dayjs(prev.date), "day")
      };
    }
    stack.push(i);
  }

  while (stack.length) {
    const idx = stack.pop();
    const item = series[idx];
    result[idx] = {
      date: item.date,
      count: item.count,
      nextSurgeDate: null,
      daysUntil: null
    };
  }

  return {
    month,
    data: result
  };
};

const getSeasonWindow = (date) => {
  const target = dayjs(date);
  const start = target.subtract(7, "day");
  const end = target.add(7, "day");
  return { start, end };
};

const fetchRentalsForDateRange = async (startDate, endDate) => {
  const from = dayjs(startDate).startOf("day").toISOString();
  const to = dayjs(endDate).endOf("day").toISOString();
  let page = 1;
  const limit = 100;
  const rentals = [];

  while (true) {
    const payload = await fetchRentals({ from, to, page, limit });
    rentals.push(...(payload.data || []));
    if (!payload.total || page * limit >= payload.total) {
      break;
    }
    page += 1;
  }

  return rentals;
};

/**
 * Build seasonal recommendations for the given date.
 * @param {string} date
 * @param {number} limit
 * @returns {Promise<object>} recommendations payload
 */
export const getRecommendations = async (date, limit) => {
  if (!isValidDate(date)) {
    const err = new Error("date must be valid YYYY-MM-DD");
    err.status = 400;
    throw err;
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > 50) {
    const err = new Error("limit must be a positive integer up to 50");
    err.status = 400;
    throw err;
  }

  const target = dayjs(date);
  const years = [target.year() - 1, target.year() - 2];
  const productCounts = new Map();

  for (const year of years) {
    const base = target.year(year);
    const { start, end } = getSeasonWindow(base.format("YYYY-MM-DD"));
    const rentals = await fetchRentalsForDateRange(start, end);
    
    rentals.forEach((rental) => {
      const productId = rental.productId;
      productCounts.set(productId, (productCounts.get(productId) || 0) + 1);
    });
  }

  if (productCounts.size === 0) {
    return { date, recommendations: [] };
  }

  const topProducts = [];
  for (const [productId, score] of productCounts.entries()) {
    if (topProducts.length < limit) {
      topProducts.push({ productId, score });
      topProducts.sort((a, b) => a.score - b.score);
    } else if (score > topProducts[0].score) {
      topProducts[0] = { productId, score };
      topProducts.sort((a, b) => a.score - b.score);
    }
  }

  topProducts.sort((a, b) => b.score - a.score);
  const productIds = topProducts.map((item) => item.productId);
  const productMap = new Map();

  for (let i = 0; i < productIds.length; i += 50) {
    const chunk = productIds.slice(i, i + 50);
    const payload = await fetchProductsBatch(chunk.join(","));
    (payload.data || []).forEach((product) => {
      productMap.set(product.id, product);
    });
  }

  const recommendations = topProducts.map((item) => {
    const product = productMap.get(item.productId) || {};
    return {
      productId: item.productId,
      name: product.name || "Unknown",
      category: product.category || "UNKNOWN",
      score: item.score
    };
  });

  return { date, recommendations };
};

/**
 * Build trending items for the UI.
 * @param {string} date
 * @param {number} limit
 * @returns {Promise<object>} trending payload
 */
export const getTrending = async (date, limit) => {
  const targetDate = date || dayjs().format("YYYY-MM-DD");
  const targetLimit = Number.isInteger(limit) && limit > 0 && limit <= 50 ? limit : 6;
  const payload = await getRecommendations(targetDate, targetLimit);
  return {
    date: payload.date,
    items: payload.recommendations
  };
};
