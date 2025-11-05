import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { default as SlashstepServer } from "#utilities/Server/Server.js";
import getActionRouter from "./GET.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import { v7 as generateUUIDv7 } from "uuid";

describe("Route: GET /actions/:actionID", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.get("/actions/:actionID", getActionRouter);
    slashstepServer.setupErrorHandling();
    await testEnvironment.initializeHTTPServer();

  });

  beforeEach(async () => {

    await testEnvironment.slashstepServer?.initializeResourceTables();
    await testEnvironment.slashstepServer?.initializePreDefinedResources();

  });

  afterEach(async () => {

    await testEnvironment.resetPostgreSQLSchema();

  });

  after(async () => {

    await testEnvironment.destroy();

  })

  it("can return a 200 status code and the requested action", async () => {

    // Grant unauthenticated users access to the action.
    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.actions.get");
    const action = await testEnvironment.createRandomAction();
    
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${action.id}`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    strictEqual(jsonResponse.id, action.id);
    strictEqual(jsonResponse.name, action.name);
    strictEqual(jsonResponse.displayName, action.displayName);
    strictEqual(jsonResponse.description, action.description);
    strictEqual(jsonResponse.appID, action.appID);

  });
  
  it("can return a 400 if the access policy ID is not a UUID", async () => {

    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/1`);
    strictEqual(numberResponse.status, 400);

    const stringResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/not-a-uuid`);
    strictEqual(stringResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {

    const action = await testEnvironment.createRandomAction();
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${action.id}`);
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to view the requested access policy", async () => {

    const user = await testEnvironment.createSlashstepUser();
    const session = await testEnvironment.createSlashstepSession(user.id);
    const sessionToken = await testEnvironment.createSlashstepSessionToken(session);
    const action = await testEnvironment.createRandomAction();
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${action.id}`, {
      headers: {
        cookie: `sessionToken=${sessionToken}`
      }
    });
    
    strictEqual(response.status, 403);

  });

  it("can return a 404 status code if the requested access policy doesn't exist", async () => {

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${generateUUIDv7()}`);
    strictEqual(response.status, 404);

  });

})