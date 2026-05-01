import {
  getPeakWindow,
  getSurgeDays,
  getRecommendations,
  getTrending
} from "../services/analytics.service.js";

export const peakWindow = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const payload = await getPeakWindow(from, to);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const surgeDays = async (req, res, next) => {
  try {
    const { month } = req.query;
    const payload = await getSurgeDays(month);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const recommendations = async (req, res, next) => {
  try {
    const { date, limit } = req.query;
    const parsedLimit = Number(limit);
    const payload = await getRecommendations(date, parsedLimit);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const trending = async (req, res, next) => {
  try {
    const { date, limit } = req.query;
    const parsedLimit = Number(limit);
    const payload = await getTrending(date, parsedLimit);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
