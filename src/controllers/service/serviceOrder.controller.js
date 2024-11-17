import { ServiceOrder } from "../../models/service.model.js";

const createServiceOrder = async (req, res) => {
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

    return res.status(201).json({
      success: true,
      data: serviceOrder,
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
    console.log("Received customerId:", customerId);
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

export { createServiceOrder, getServiceByCustomerId };
