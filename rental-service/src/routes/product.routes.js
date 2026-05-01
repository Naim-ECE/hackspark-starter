import { Router } from "express";
import {
  getStatus,
  getProducts,
  getProductById,
  getAvailabilityByProduct,
  getUserTopCategories,
  getKthBusiest,
  getFreeStreak,
  getFeed
} from "../controllers/product.controller.js";
import rateLimiter from "../middlewares/rateLimiter.js";

const router = Router();

router.get("/status", rateLimiter, getStatus);
router.get("/rentals/products", rateLimiter, getProducts);
router.get("/rentals/products/:id", rateLimiter, getProductById);
router.get("/rentals/products/:id/availability", rateLimiter, getAvailabilityByProduct);
router.get("/rentals/users/:id/top-categories", rateLimiter, getUserTopCategories);
router.get("/rentals/kth-busiest-date", rateLimiter, getKthBusiest);
router.get("/rentals/products/:id/free-streak", rateLimiter, getFreeStreak);
router.get("/rentals/merged-feed", rateLimiter, getFeed);

export default router;
