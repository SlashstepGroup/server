import { after, before, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import Server from "#utilities/Server/Server.js";
import { Server as HTTPServer } from "http";
import getAccessPolicyRouter from "./get.js";
import { v7 as generateUUIDv7 } from "uuid";
import { resolve } from "node:path";

describe("Route: GET /access-policies/:id", () => {

  let httpServer: HTTPServer;

  before(async () => {

    console.log(process.env.NODE_EXTRA_CA_CERTS);
    const server = new Server({
      environment: "development",
      port: 3000
    });
    server.setupMiddleware();
    server.app.get("/access-policies/:id", getAccessPolicyRouter);
    httpServer = await server.listen();

  });

  after(() => {

    httpServer.close();

  })

  it.todo("can return a 200 status code and the requested access policy", async () => {

  });

  it.todo("can return a 401 status code if the user needs authentication", async () => {

  });

  it.todo("can return a 403 status code if the user doesn't have permission to view the requested access policy", async () => {

  });

  it.todo("can return a 404 status code if the requested access policy doesn't exist", async () => {

    const response = await fetch(`https://localhost:3000/access-policies/${generateUUIDv7()}`, {
      
    });
    strictEqual(response.status, 404);

  });

})