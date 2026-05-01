import { Router } from "express";
import { getStatus } from "../controllers/status.controller.js";
import {
  peakWindow,
  surgeDays,
  recommendations,
  trending
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/status", getStatus);
router.get("/analytics/peak-window", peakWindow);
router.get("/analytics/surge-days", surgeDays);
router.get("/analytics/recommendations", recommendations);
router.get("/analytics/trending", trending);

export default router;
