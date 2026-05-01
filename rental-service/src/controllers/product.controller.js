import {
  fetchStatus,
  listProducts,
  getProduct,
  getAvailability,
  getTopCategories,
  getKthBusiestDate,
  getLongestFreeStreak,
  getMergedFeed
} from "../services/product.service.js";

export const getStatus = async (req, res, next) => {
  try {
    const payload = await fetchStatus();
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const payload = await listProducts(req.query);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const payload = await getProduct(req.params.id);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getAvailabilityByProduct = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const payload = await getAvailability(req.params.id, from, to);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getUserTopCategories = async (req, res, next) => {
  try {
    const payload = await getTopCategories(req.params.id, req.query.k);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getKthBusiest = async (req, res, next) => {
  try {
    const { from, to, k } = req.query;
    const payload = await getKthBusiestDate(from, to, k);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getFreeStreak = async (req, res, next) => {
  try {
    const { year } = req.query;
    const payload = await getLongestFreeStreak(req.params.id, year);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getFeed = async (req, res, next) => {
  try {
    const { productIds, limit } = req.query;
    const payload = await getMergedFeed(productIds, limit);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
