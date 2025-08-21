import express from "express";
import { Pool } from "pg";
import cors from "cors";
import Server from "#utilities/Server.js";
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

if (process.argv[2].toLowerCase() === "--setup") {

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

  // Set up routes
  console.log("Setting up routes...");

  const app = express();
  app.use(express.json());
  app.use(cors());
  app.disable("x-powered-by");
  // app.use("/runs", runsRouter);
  // app.use("/user", userRouter);
  // app.use("/users", usersRouter);
  // app.use("/threads", threadsRouter);
  // app.use("/posts", postsRouter);
  // app.use("/permissions", permissionsRouter);
  // app.use("/games", gamesRouter);
  // app.use("/groups", groupsRouter);
  // app.use("/forums", forumsRouter);
  // app.use("/likes", likesRouter);

  app.get("/", (_, response) => {
    
    response.json({ success: true });

  });

  app.use((_, response) => {

    response.json({
      message: "Not found"
    });

  });

  const { APP_PORT } = process.env; 
  app.listen(APP_PORT, () =>
    console.log(`\x1b[32mWaltz Server is now online at port ${APP_PORT}.\x1b[0m`),
  );

}