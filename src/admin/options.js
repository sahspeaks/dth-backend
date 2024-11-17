import componentLoader from "./component-loader.js";
import * as Models from "../models/index.js";
import { dark, light, noSidebar } from "@adminjs/themes";

const options = {
  componentLoader,
  rootPath: "/admin",
  defaultTheme: dark.id,
  availableThemes: [dark, light, noSidebar],
  resources: [
    {
      resource: Models.Admin,
      options: {
        listProperties: ["email", "role"],
        filterProperties: ["email", "role"],
      },
    },
    {
      resource: Models.Customer,
      options: {
        listProperties: ["email", "role"],
        filterProperties: ["email", "role"],
      },
    },
    {
      resource: Models.Product,
    },
    {
      resource: Models.Category,
    },
    {
      resource: Models.Order,
      options: {
        listProperties: [
          "orderId",
          // "customerName",
          "status",
          "paymentId",
          "totalAmount",
        ],
        filterProperties: ["orderId", "status", "totalAmount"],
      },
    },
    {
      resource: Models.ServiceOrder,
      options: {
        listProperties: ["service", "customerName", "status", "price"],
        filterProperties: ["service", "status"],
      },
    },
  ],
  databases: [],
  branding: {
    companyName: "MY STB",
    withMadeWithLove: false,
    favicon:
      "https://e7.pngegg.com/pngimages/408/746/png-clipart-satellite-dish-illustration-computer-icons-satellite-dish-aerials-satellite-dish-icon-miscellaneous-text.png",
  },
};

export default options;
