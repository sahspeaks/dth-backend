import mongoose from "mongoose";
// import { Counter } from "./counter.model.js";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String, // Keeping as String to match frontend id type which can be string|number
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});
const deliveryAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  doorNo: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
    required: false,
  },
});
const orderSchema = new mongoose.Schema(
  {
    orderItems: [orderItemSchema],
    deliveryAddress: deliveryAddressSchema,
    customerId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    orderId: {
      type: String,
      unique: true,
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 499,
    },
    paymentId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "delivered", "cancelled"],
      default: "pending",
    },
    orderType: {
      type: String,
      enum: ["BUY_NOW", "CART_CHECKOUT"],
    },
  },
  {
    timestamps: true,
  }
);

// async function getNextSequenceValue(sequenceName) {
//   const sequenceDocument = await Counter.findOneAndUpdate(
//     { name: sequenceName },
//     { $inc: { sequence_value: 1 } },
//     { new: true, upsert: true }
//   );
//   return sequenceDocument.sequence_value;
// }
// orderSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     const sequenceValue = await getNextSequenceValue("orderId");
//     this.orderId = `ORDR${sequenceValue.toString().padStart(5, "0")}`;
//   }
//   next();
// });
// Generate unique order ID
orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model("Order").countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    this.orderId = `ORD${year}${month}${(count + 1)
      .toString()
      .padStart(5, "0")}`;
  }
  next();
});
export const Order = mongoose.model("Order", orderSchema);
