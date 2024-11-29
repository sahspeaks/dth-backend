import { ServiceOrder } from "../../models/service.model.js";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";
const createServiceOrder = async (req, res) => {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  try {
    const {
      service,
      date,
      time,
      price,
      customerId,
      customerName,
      // Address fields
      fullName,
      email,
      phone,
      doorNo,
      street,
      city,
      state,
      pincode,
      landmark,
    } = req.body;

    // Basic validation
    if (!service || !date || !time || !price || !customerId || !customerName) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    // For installation and support services, check required address fields
    if (service === "installation" || service === "support") {
      if (
        !fullName ||
        !email ||
        !phone ||
        !doorNo ||
        !street ||
        !city ||
        !state ||
        !pincode
      ) {
        return res.status(400).json({
          message:
            "All address fields are required for installation and support services",
        });
      }
    }

    // Create the address object from the flat fields
    const address =
      service === "installation" || service === "support"
        ? {
            fullName,
            email,
            phone,
            doorNo,
            street,
            city,
            state,
            pincode,
            landmark: landmark || "",
          }
        : null;

    // Create service order
    const serviceOrder = await ServiceOrder.create({
      service,
      date: new Date(date),
      time,
      price,
      customerId,
      customerName,
      ...(address && { address }),
    });

    // Create Razorpay order
    const amountInPaise = price * 100;
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${serviceOrder.serviceId}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(201).json({
      success: true,
      data: serviceOrder,
      razorpayOrderId: razorpayOrder.id,
      message: "Service order created successfully",
    });
  } catch (error) {
    console.error("Error creating service order:", error);
    return res.status(500).json({
      message: "Error creating service order",
      error: error.message,
    });
  }
};

const getServiceByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    // console.log("Received customerId:", customerId);
    const serviceOrders = await ServiceOrder.find({ customerId });
    return res.status(200).json({
      success: true,
      data: serviceOrders,
      message: "Service orders fetched successfully",
    });
    // Handle errors
  } catch (error) {
    console.error("Error fetching service orders:", error);
    return res.status(500).json({
      message: "Error fetching service orders",
      error: error.message,
    });
  }
};

const postPayment = async (req, res) => {
  try {
    // Verify the Razorpay webhook signature
    const { serviceId, paymentId, razorpayOrderId } = req.body;
    // console.log("Received payment completion webhook:", req.body);

    // Find the order in the database
    const order = await ServiceOrder.findOneAndUpdate(
      { serviceId }, // query
      {
        $set: {
          paymentId: paymentId,
          razorpayOrderId: razorpayOrderId,
        },
      }, // update
      { new: true } // options
    );

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
      subject: `New Service Order ${order.serviceId}`,
      text:
        `A new service order has been placed.\n\n` +
        `Service Type: ${order.service.toUpperCase()} \n\n` +
        `Placed by ${order.customerName}\n\n` +
        `Booked Slot on Date: ${order.date.toLocaleDateString("en-GB")} \n\n` +
        `Slot Time:  ${order.time}`,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error("Error sending email:", error);
      }
      // console.log("Email sent:", info.response);
    });

    if (!order) {
      return res.status(404).json({ error: "Service Order not found" });
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

export { createServiceOrder, getServiceByCustomerId, postPayment };
