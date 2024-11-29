import mongoose from "mongoose";

const serviceOrderSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    unique: true,
  },
  razorpayOrderId: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  service: {
    type: String,
    required: true,
    enum: ["installation", "support", "repair", "maintenance"],
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  address: {
    fullName: String,
    email: String,
    phone: String,
    doorNo: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate automatic serviceId before saving
serviceOrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    // Get the count of documents for the current month
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      },
    });

    // Generate serviceId: SRV-YY-MM-XXXX (e.g., SRV-23-12-0001)
    this.serviceId = `SRV${year}${month}${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

const ServiceOrder = mongoose.model("ServiceOrder", serviceOrderSchema);
export { ServiceOrder };
