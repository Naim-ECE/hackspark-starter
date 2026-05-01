import { Router } from "express";
import { getStatus } from "../controllers/status.controller.js";
import {
  proxyUser,
  proxyRental,
  proxyAnalytics,
  proxyChat
} from "../controllers/proxy.controller.js";
import { proxyCentral } from "../controllers/centralProxy.controller.js";

const router = Router();

router.get("/status", getStatus);
router.get("/central/*", proxyCentral);

router.post("/users/register", proxyUser);
router.post("/users/login", proxyUser);
router.get("/users/me", proxyUser);
router.get("/users/:id/discount", proxyUser);

router.get("/rentals/products", proxyRental);
router.get("/rentals/products/:id", proxyRental);
router.get("/rentals/products/:id/availability", proxyRental);
router.get("/rentals/users/:id/top-categories", proxyRental);
router.get("/rentals/kth-busiest-date", proxyRental);
router.get("/rentals/products/:id/free-streak", proxyRental);
router.get("/rentals/merged-feed", proxyRental);

router.get("/analytics/recommendations", proxyAnalytics);
router.get("/analytics/trending", proxyAnalytics);
router.get("/analytics/surge-days", proxyAnalytics);
router.get("/analytics/peak-window", proxyAnalytics);

router.get("/chat/sessions", proxyChat);
router.get("/chat/:sessionId/history", proxyChat);
router.post("/chat", proxyChat);

export default router;
