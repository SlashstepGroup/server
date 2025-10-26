import Item from "#resources/Item/Item.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import User from "#resources/User/User.js";
import App from "#resources/App/App.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import Session from "#resources/Session/Session.js";
import os from "os";
import { createServer as createHTTPSServer } from "https";
import instanceRouter from "#routes/instance/index.js";
import itemsRouter from "#routes/items/index.js";
import workspacesRouter from "#routes/workspaces/index.js";
import projectsRouter from "#routes/projects/index.js";
import usersRouter from "#routes/users/index.js";
import express, { Application, Request, Response, response } from "express";
import cors from "cors";
import { read } from "read";
import { hash as hashPassword } from "argon2";
import userRouter from "#routes/user/index.js";
import cookieParser from "cookie-parser";
import accessPoliciesRouter from "#routes/access-policies/index.js";
import Group from "#resources/Group/Group.js";
import Role from "#resources/Role/Role.js";
import Milestone from "#resources/Milestone/Milestone.js";
import { Server as HTTPServer, createServer as createHTTPServer } from "http";

export type ServerProperties = {
  environment: string;
  port: number;
  postgreSQLHost: string;
  postgreSQLPort: number;
  postgreSQLDatabaseName: string;
  postgreSQLUsername: string;
  postgreSQLPassword: string;
}

export default class Server {

  app: Application;
  pool: Pool;
  port: number;
  environment: string;

  constructor(properties: ServerProperties) {

    this.pool = new Pool({
      user: properties.postgreSQLUsername,
      password: properties.postgreSQLPassword,
      host: properties.postgreSQLHost,
      port: properties.postgreSQLPort,
      database: properties.postgreSQLDatabaseName,
      connectionTimeoutMillis: 1000
    });

    const app = express();
    this.app = app;
    this.environment = properties.environment;
    this.port = properties.port;

  }

  async initializeResourceTables(): Promise<void> {

    const poolClient = await this.pool.connect();

    try {

      const createProjectsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-app-schema.sql"), "utf8");
      const createUUIDv7FunctionsQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-uuidv7-functions.sql"), "utf8");
      await poolClient.query(createProjectsTableQuery);
      await poolClient.query(createUUIDv7FunctionsQuery);

    } finally {

      poolClient.release();

    }

    await Group.initializeTable(this.pool);
    await Workspace.initializeTable(this.pool);
    await Project.initializeTable(this.pool);
    await Role.initializeTable(this.pool);
    await Milestone.initializeTable(this.pool);
    await Item.initializeTable(this.pool);
    await User.initializeTable(this.pool);
    await App.initializeTable(this.pool);
    await Action.initializeTable(this.pool);
    await AccessPolicy.initializeTable(this.pool);
    await ActionLog.initializeTable(this.pool);
    await Session.initializeTable(this.pool);

  }

  async initializePreDefinedResources(): Promise<void> {

    await AccessPolicy.initializeActions(Action, this.pool);
    await AccessPolicy.initializePreDefinedRoles(Role, this.pool);
    await AccessPolicy.initializePreDefinedRoleAccessPolicies(Action, this.pool);

    await User.initializePreDefinedRoles(Role, this.pool);

  }

  static getIPv4Address(): string | undefined {

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

  async setup(): Promise<void> {

    let shouldLineBreak = false;
    while (true) {

      // Choose a random, 6-digit console code.
      if (shouldLineBreak) {

        console.log();

      }

      console.log(`\x1b[90mYou are in setup mode. What would you like to do?\x1b[0m`);
      console.log(`\x1b[90m[1] Initialize the database tables, views, and initial rows\x1b[0m`);
      console.log(`\x1b[90m[2] Create a new instance admin user\x1b[0m`);
      console.log(`\x1b[90m[3] Start server in user mode\x1b[0m`);
      console.log(`\x1b[90m[4] Exit\x1b[0m`);
      
      shouldLineBreak = true;

      let choice;
      try {

        choice = await read({prompt: ">"});

      } catch (error) {

        if (error instanceof Error && error.message === "canceled") {

          return;

        }

      }

      if (choice) {

        switch (choice.trim()) {

          case "1":
            
            console.log("\n\x1b[34mInitializing database tables, views, and initial rows...\x1b[0m");
            await this.initializeResourceTables();
            console.log("\x1b[32mDone!\x1b[0m");

            break;

          case "2": {

            let shouldBreak = false;

            const getInput = async (message: string, isSilent: boolean = false) => {

              let variable;

              while (!variable) {

                console.log(message);
                variable = await read({prompt: ">", silent: isSilent});
                if (isSilent) {

                  console.log();

                }

              }

              return variable;

            }

            let instanceAdminUsername: string | undefined;
            let instanceAdminPassword: string | undefined;
            let didConfirmPassword: boolean | undefined;

            while ((!instanceAdminUsername || !instanceAdminPassword || !didConfirmPassword) && !shouldBreak) {

              try {

                instanceAdminUsername = instanceAdminUsername ?? await getInput("\n\x1b[90mWhat should the instance admin username be?\x1b[0m");
                instanceAdminPassword = instanceAdminPassword ?? await getInput("\n\x1b[90mWhat should the instance admin password be?\x1b[0m", true);
                didConfirmPassword = didConfirmPassword || (await getInput("\n\x1b[90mEnter the password again to confirm.\x1b[0m", true)) === instanceAdminPassword;

                if (!didConfirmPassword) {

                  console.log("\n\x1b[31mPasswords do not match. Please try again.\x1b[0m");
                  continue;

                }

                console.log();
                console.log("\x1b[34mCreating instance admin user...\x1b[0m");

                let user;

                try {

                  user = await User.create({
                    username: instanceAdminUsername,
                    displayName: instanceAdminUsername,
                    hashedPassword: await hashPassword(instanceAdminPassword)
                  }, this.pool);

                } catch (error) {

                  if (error instanceof DatabaseError && error.code === "23505") {

                    console.log("\x1b[31mUsername already exists. Please try again.\x1b[0m");
                    instanceAdminUsername = undefined;
                    instanceAdminPassword = undefined;
                    didConfirmPassword = undefined;
                    continue;

                  }

                  throw error;

                }

                const accessPolicies = await AccessPolicy.grantDefaultAdminPermissions(user.id, this.pool);

                console.log(`\x1b[32mSuccessfully created user ${instanceAdminUsername} with ${accessPolicies.length} admin-level access policies.\x1b[0m`);

              } catch (error) {

                if (error instanceof Error && error.message === "canceled") {

                  console.log();

                  if (!instanceAdminUsername) {

                    shouldBreak = true;
                    break;

                  } else if (!instanceAdminPassword) {

                    instanceAdminUsername = undefined;

                  } else if (!didConfirmPassword) {

                    instanceAdminPassword = undefined;

                  }

                } else {

                  throw error;

                }

              }

            }

            if (shouldBreak) {

              break;

            }

            break;

          }

          case "3":
            console.log();
            await this.start();
            return;

          case "4":
            return;

        }

      }

    }

  }

  setupRoutes() {

    this.app.use("/access-policies", accessPoliciesRouter);
    this.app.use("/instance", instanceRouter);
    this.app.use("/items", itemsRouter);
    this.app.use("/projects", projectsRouter);
    this.app.use("/workspaces", workspacesRouter);
    this.app.use("/user", userRouter);
    this.app.use("/users", usersRouter);

    this.app.get("/", (_, response) => {
      
      response.json({ success: true });

    });

    this.app.use((_, response) => {

      response.status(404).json({
        message: "Not found"
      });

    });

  }
  
  setupMiddleware() {

    this.app.use((_, response, next) => {

      response.locals.server = this;
      next();

    });
    this.app.use(express.json());
    this.app.use(cookieParser());
    const { environment } = this;
    this.app.use(cors({
      origin(requestOrigin, callback) {
        
        if (environment === "production") {

          callback(null, requestOrigin === "https://app.slashstep.com");

        } else {

          callback(null, true);

        }

      },
      credentials: true
    }));
    this.app.disable("x-powered-by");

  }

  async listen(): Promise<HTTPServer> {

    return await new Promise((resolve, reject) => {

      if (this.environment === "development") {

        const httpsServer = createHTTPSServer({
          key: readFileSync("./certificates/localhost+2-key.pem"),
          cert: readFileSync("./certificates/localhost+2.pem")
        }, this.app);
        
        httpsServer.listen(this.port, () => resolve(httpsServer));

      } else {

        const httpServer = createHTTPServer(this.app);
        httpServer.listen(this.port, () => resolve(httpServer));

      }

    });

  }

  async start(): Promise<void> {

    console.log("Setting up middleware...");
    this.setupMiddleware();
    
    console.log("Setting up routes...");
    this.setupRoutes();

    console.log("Listening for requests...");
    await this.listen();
    
    const ipv4Address = Server.getIPv4Address();
    console.log(`\x1b[32mSlashstep Server is now online at port ${this.port}. It is also available on your local network at ${ipv4Address}:${this.port}.\x1b[0m`)

  }

}