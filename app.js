import express from "express";
import AdminJS from "adminjs";
import { buildAuthenticatedRouter } from "@adminjs/express";
import provider from "./src/admin/auth-provider.js";
import options from "./src/admin/options.js";
import initializeDb from "./src/db/index.js";
import ConnectMongoDBSession from "connect-mongodb-session";
import session from "express-session";
import * as dotenv from "dotenv";
dotenv.config();
console.log("DATABASE_URL:", process.env.DATABASE_URL);
const port = process.env.PORT || 3000;
const start = async () => {
  const app = express();
  await initializeDb();
  const admin = new AdminJS(options);
  if (process.env.NODE_ENV === "production") {
    await admin.initialize();
  } else {
    admin.watch();
  }
  const MongoDBStore = ConnectMongoDBSession(session);
  console.log(process.env.DATABASE_URL);

  const sessionStore = new MongoDBStore({
    uri: process.env.DATABASE_URL,
    collection: "sessions",
  });
  sessionStore.on("error", (error) => {
    console.log("Session store error", error);
  });
  const isProduction =
    process.env.RENDER === "true" || process.env.NODE_ENV === "production";
  const cookieConfig = {
    cookie: {
      httpOnly: isProduction,
      secure: isProduction,
    },
  };
  const router = buildAuthenticatedRouter(
    admin,
    {
      cookiePassword: process.env.COOKIE_SECRET,
      cookieName: "adminjs",
      provider,
    },
    null,
    {
      store: sessionStore,
      secret: process.env.COOKIE_SECRET,
      saveUninitialized: true,
      resave: true,
      cookieConfig,
      name: "adminjs",
    }
  );
  app.use(admin.options.rootPath, router);
  app.listen(port, () => {
    console.log(
      `AdminJS available at http://localhost:${port}${admin.options.rootPath}`
    );
  });
};
start();
