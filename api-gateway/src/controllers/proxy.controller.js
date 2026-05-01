import {
  forwardRequest,
  normalizeProductsList,
  normalizeProduct,
  normalizeRecommendations,
  normalizeChatReply
} from "../services/proxy.service.js";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const RENTAL_SERVICE_URL = process.env.RENTAL_SERVICE_URL;
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL;
const AGENTIC_SERVICE_URL = process.env.AGENTIC_SERVICE_URL;

export const proxyUser = async (req, res, next) => {
  try {
    const data = await forwardRequest({
      baseUrl: USER_SERVICE_URL,
      path: req.path,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query
    });
    res.status(req.method === "POST" && req.path === "/users/register" ? 201 : 200).json(data);
  } catch (error) {
    next(error);
  }
};

export const proxyRental = async (req, res, next) => {
  try {
    const data = await forwardRequest({
      baseUrl: RENTAL_SERVICE_URL,
      path: req.path,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    if (req.path === "/rentals/products") {
      res.status(200).json(normalizeProductsList(data));
      return;
    }

    // Only normalize product detail if it's strictly /rentals/products/:id
    const productDetailMatch = req.path.match(/^\/rentals\/products\/[^/]+$/);
    if (productDetailMatch) {
      res.status(200).json(normalizeProduct(data));
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const proxyAnalytics = async (req, res, next) => {
  try {
    const data = await forwardRequest({
      baseUrl: ANALYTICS_SERVICE_URL,
      path: req.path,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    if (req.path === "/analytics/recommendations") {
      res.status(200).json(normalizeRecommendations(data));
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const proxyChat = async (req, res, next) => {
  try {
    const data = await forwardRequest({
      baseUrl: AGENTIC_SERVICE_URL,
      path: req.path,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    if (req.path === "/chat" && req.method === "POST") {
      res.status(200).json(normalizeChatReply(data));
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
