import { Router } from "express";
import statusRoutes from "./product.routes.js";

const router = Router();

router.use(statusRoutes);

export default router;
