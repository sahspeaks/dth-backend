import {
  createOrder,
  getOrdersByCustomer,
} from "../controllers/orders/order.controller.js";
import Router from "express";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// Create a new order
router.post("/create-order", verifyToken, createOrder);
// Get orders by customer
router.get("/orders/:customerId", verifyToken, getOrdersByCustomer);
export default router;
