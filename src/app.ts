import express from "express";
import { Pool } from "pg";
import cors from "cors";
import Server from "#utilities/Server/Server.js";
import os from "os";
import { createServer as createHTTPSServer } from "https";
import { readFileSync } from "fs";
import instanceRouter from "./routes/instance/index.js";
import itemsRouter from "./routes/items/index.js";
import workspacesRouter from "./routes/workspaces/index.js";
import projectsRouter from "./routes/projects/index.js";
// import userRouter from "./routes/user/index.js";
// import usersRouter from "./routes/users/index.js";
// import runsRouter from "./routes/runs/index.js";
// import gamesRouter from "./routes/games/index.js";
// import groupsRouter from "./routes/groups/index.js";
// import forumsRouter from "./routes/forums/index.js";
// import likesRouter from "./routes/likes/index.js";
// import postsRouter from "./routes/posts/index.js";
// import threadsRouter from "./routes/threads/index.js";
// import permissionsRouter from "./routes/permissions/index.js";
// import Permission from "#classes/Permission.js";

if (process.argv[2]?.toLowerCase() === "--setup") {

  await Server.setup();

} else {

  // Connect to the PostgreSQL server
  console.log("Setting up PostgreSQL pool...");

  const { POSTGRESQL_USERNAME, POSTGRESQL_PASSWORD, POSTGRESQL_HOST, POSTGRESQL_PORT: rawPostgresqlPort, POSTGRESQL_DATABASE_NAME } = process.env;
  const POSTGRESQL_PORT = rawPostgresqlPort ? parseInt(rawPostgresqlPort, 10) : undefined;

  const postgreSQLPool = new Pool({
    user: POSTGRESQL_USERNAME,
    password: POSTGRESQL_PASSWORD,
    host: POSTGRESQL_HOST,
    port: POSTGRESQL_PORT,
    database: POSTGRESQL_DATABASE_NAME,
    connectionTimeoutMillis: 1000
  });

  console.log("Initializing resource tables...");
  await Server.initializeResourceTables(postgreSQLPool);

  // Set up routes
  console.log("Setting up routes...");

  const app = express();
  app.use((_, response, next) => {

    response.locals.pool = postgreSQLPool;
    next();

  });
  app.use(express.json());
  app.use(cors());
  app.disable("x-powered-by");
  app.use("/instance", instanceRouter);
  app.use("/items", itemsRouter);
  app.use("/projects", projectsRouter);
  app.use("/workspaces", workspacesRouter);

  app.get("/", (_, response) => {
    
    response.json({ success: true });

  });

  app.use((_, response) => {

    response.status(404).json({
      message: "Not found"
    });

  });

  const getIPv4Address = () => {

    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {

      const interfaces = networkInterfaces[interfaceName];
      if (!interfaces) continue;
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
      
    }

  }

  const ipv4Address = getIPv4Address();

  const { APP_PORT, APP_ENVIRONMENT } = process.env;

  if (APP_ENVIRONMENT === "development") {

    createHTTPSServer({
      key: readFileSync("./ssl/server.key"),
      cert: readFileSync("./ssl/server.cert")
    }, app).listen(APP_PORT, () =>
      console.log(`\x1b[32mSlashstep Server is now online at port ${APP_PORT}. It is also available on your local network at ${ipv4Address}:${APP_PORT}.\x1b[0m`),
    );

  } else {

    app.listen(APP_PORT, () =>
      console.log(`\x1b[32mSlashstep Server is now online at port ${APP_PORT}. It is also available on your local network at ${ipv4Address}:${APP_PORT}.\x1b[0m`),
    );

  }

}