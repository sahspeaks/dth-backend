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
        listProperties: ["orderId", "customer", "status", "paymentId", "price"],
        filterProperties: ["orderId", "status", "price"],
      },
    },
    {
      resource: Models.Counter,
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
