import { Router } from "express";
import { getStatus } from "../controllers/status.controller.js";
import { sessions, history, chat } from "../controllers/chat.controller.js";

const router = Router();

router.get("/status", getStatus);
router.get("/chat/sessions", sessions);
router.get("/chat/:sessionId/history", history);
router.post("/chat", chat);

export default router;
