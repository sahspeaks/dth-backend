import mongoose from "mongoose";
import { Counter } from "./counter.model.js";
const orderSchema = new mongoose.Schema({
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  orderId: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "delivered", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Other fields as needed for delivery
  deliveryAddress: {
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
    },
  },
});

async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.sequence_value;
}
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const sequenceValue = await getNextSequenceValue("orderId");
    this.orderId = `ORDR${sequenceValue.toString().padStart(5, "0")}`;
  }
  next();
});

export const Order = mongoose.model("Order", orderSchema);
