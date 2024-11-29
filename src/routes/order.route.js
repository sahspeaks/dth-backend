import {
  createOrder,
  getOrdersByCustomer,
  postPayment,
} from "../controllers/orders/order.controller.js";
import Router from "express";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// Create a new order
router.post("/create-order", verifyToken, createOrder);
// Get orders by customer
router.get("/orders/:customerId", verifyToken, getOrdersByCustomer);
//update order by payment
router.post("/payment-complete", verifyToken, postPayment);

export default router;
