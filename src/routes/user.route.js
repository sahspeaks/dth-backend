import Router from "express";

import {
  loginCustomer,
  signupCustomer,
  fetchCustomer,
  refreshToken,
  updateCustomer,
} from "../controllers/auth/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

//login customer
router.route("/customer/login").post(loginCustomer);
//signup customer
router.route("/customer/signup").post(signupCustomer);
//refresh token
router.route("/refresh-token").post(refreshToken);
//fetch customer
router.route("/customer/:id").get(verifyToken, fetchCustomer);
//update customer
router.route("/customer/update/:id").put(verifyToken, updateCustomer);

export default router;
