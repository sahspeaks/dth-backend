import Router from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createServiceOrder,
  getServiceByCustomerId,
} from "../controllers/service/serviceOrder.controller.js";
const router = Router();

// Create a new service order
router.post("/create-service", verifyToken, createServiceOrder);
// Get service orders by customer ID
router.get("/services/:customerId", verifyToken, getServiceByCustomerId);

export default router;
