import { Router } from "express";
import { getStatus } from "../controllers/status.controller.js";
import { register, login, me, discount } from "../controllers/user.controller.js";

const router = Router();

router.get("/status", getStatus);
router.post("/users/register", register);
router.post("/users/login", login);
router.get("/users/me", me);
router.get("/users/:id/discount", discount);

export default router;
