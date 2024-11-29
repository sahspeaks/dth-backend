import { Order } from "../../models/order.model.js";
import { Product } from "../../models/index.js";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";

export const createOrder = async (req, res) => {
  let session = null;
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    // Ensure we're connected to a replica set
    if (!mongoose.connection.readyState === 1) {
      throw new Error("Database connection not ready");
    }

    // Start session and transaction
    session = await mongoose.startSession();
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
    });

    const {
      orderItems,
      deliveryAddress,
      customerId,
      customerName,
      totalAmount,
      shippingCost,
      orderType,
    } = req.body;

    // Validate and check inventory for all products
    const inventoryChecks = await Promise.all(
      orderItems.map(async (item) => {
        // Validate if productId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(item.productId)) {
          throw new Error(`Invalid product ID format: ${item.productId}`);
        }

        // Use lean() for better performance when we don't need the document instance
        const product = await Product.findById(item.productId)
          .session(session)
          .select("name price stock")
          .lean();

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }

        // Verify price matches
        if (product.price !== item.price) {
          throw new Error(
            `Price mismatch for product ${product.name}. Expected: ${product.price}, Received: ${item.price}`
          );
        }

        return {
          ...product,
          requestedQuantity: item.quantity,
        };
      })
    );

    // Update stock for all products
    await Promise.all(
      inventoryChecks.map(async (product) => {
        const result = await Product.updateOne(
          {
            _id: product._id,
            stock: { $gte: product.requestedQuantity }, // Double-check stock availability
          },
          {
            $inc: { stock: -product.requestedQuantity },
          },
          { session }
        );

        if (result.modifiedCount !== 1) {
          throw new Error(`Failed to update stock for product ${product.name}`);
        }
      })
    );

    // Create and save the order
    const order = new Order({
      orderItems,
      deliveryAddress,
      customerId,
      customerName,
      totalAmount,
      shippingCost,
      orderType,
      createdAt: new Date(),
    });

    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    // create razorpay order
    const amountInPaise = totalAmount * 100 + shippingCost * 100;
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${order.orderId}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Send success response
    res.status(201).json({
      success: true,
      orderId: order.orderId,
      razorpayOrderId: razorpayOrder.id,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Error placing order:", error);

    // Attempt to abort the transaction if it exists and is active
    if (session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }

    // Determine appropriate error response
    let statusCode = 400;
    let errorMessage = error.message;

    if (error.name === "MongoError" || error.name === "MongoServerError") {
      statusCode = 500;
      errorMessage = "Database operation failed";
    }

    res.status(statusCode).json({
      success: false,
      error: "Failed to place order",
      message: errorMessage,
    });
  } finally {
    // End session if it exists
    if (session) {
      try {
        await session.endSession();
      } catch (endSessionError) {
        console.error("Error ending session:", endSessionError);
      }
    }
  }
};

// create me a controller for getting all orders placed by a customer with specific orderId
export const getOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await Order.find({ customerId });
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get orders",
      message: error.message,
    });
  }
};

export const postPayment = async (req, res) => {
  try {
    // Verify the Razorpay webhook signature
    const { orderId, paymentId, razorpayOrderId } = req.body;
    // console.log("Received payment completion webhook:", req.body);

    // Find the order in the database
    const order = await Order.findOneAndUpdate(
      { orderId }, // query
      {
        $set: {
          paymentId: paymentId,
          razorpayOrderId: razorpayOrderId,
        },
      }, // update
      { new: true } // options
    );
    // Create items summary for email body
    const itemsSummary = order.orderItems
      .map(
        (item) =>
          `- ${item.productName} (Quantity: ${item.quantity}, Price: ₹${item.price})`
      )
      .join("\n");
    //send email to admin
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: {
        name: "MY STB",
        address: process.env.EMAIL_USER,
      },
      to: process.env.EMAIL_USER,
      subject: `A New Order ${order.orderId} has been placed`,
      text:
        `A new order has been processed.\n\n` +
        `Order ID: ${orderId}\n` +
        `Items Ordered:\n${itemsSummary}\n\n` +
        `Total Amount: ₹${order.totalAmount}\n\n` +
        `Shipping Details:\n` +
        `${order.deliveryAddress.fullName}\n` +
        `${order.deliveryAddress.doorNo}, ${order.deliveryAddress.street}\n` +
        `${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}\n` +
        `Phone: ${order.deliveryAddress.phone}\n` +
        `Email: ${order.deliveryAddress.email}`,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error("Error sending email:", error);
      }
      // console.log("Email sent:", info.response);
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res
      .status(200)
      .json({ message: "Payment completed successfully", data: order });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({
      error: "Error processing payment",
      details: error.message,
    });
  }
};
