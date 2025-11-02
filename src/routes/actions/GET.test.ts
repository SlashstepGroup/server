import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { default as SlashstepServer } from "#utilities/Server/Server.js";
import getAccessPolicyRouter from "./GET.js";
import Action, { BaseActionProperties } from "#resources/Action/Action.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import { v7 as generateUUIDv7 } from "uuid";
import assert from "node:assert/strict";

describe("Route: GET /actions", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.get("/actions", getAccessPolicyRouter);
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

  it("can return a 200 status code and the requested actions", async () => {

    // Grant unauthenticated users access to the action.
    await testEnvironment.createAccessPolicyForUnauthenticatedUsers("slashstep.actions.list");
    const action = await testEnvironment.createRandomAction();
    
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    assert(jsonResponse.totalItemCount >= 1);
    assert(jsonResponse.items instanceof Array);
    
    const actionResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions?query=id = "${action.id}"`);
    strictEqual(actionResponse.status, 200);

    const accessPolicyJSONResponse = await actionResponse.json();
    strictEqual(accessPolicyJSONResponse.totalItemCount, 1);
    assert(accessPolicyJSONResponse.items instanceof Array);
    assert((accessPolicyJSONResponse.items as BaseActionProperties[]).find((actionData) => actionData.id === action.id));

  });

  it("can return up to 1,000 actions by default", async () => {

    // Grant unauthenticated users access to the action.
    await testEnvironment.createAccessPolicyForUnauthenticatedUsers("slashstep.actions.list");

    const originalActionCount = await Action.count("", slashstepServer.pool);
    const newActionCount = Math.max(0, 1001 - originalActionCount);
    const actions = [];
    for (let i = 0; newActionCount > i; i++) {

      const createRandomAction = async () => {

        const action = await Action.create({
          name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
          displayName: TestEnvironment.generateRandomString(16),
          description: TestEnvironment.generateRandomString(128)
        }, slashstepServer.pool);

        return action;

      }

      const action = await createRandomAction();
      actions.push(action);

    }
    
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    strictEqual(jsonResponse.totalItemCount, originalActionCount + newActionCount);
    assert(jsonResponse.items instanceof Array);
    strictEqual(jsonResponse.items.length, 1000);

    const offsetResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions?query=offset 1000`);
    strictEqual(response.status, 200);

    const jsonOffsetResponse = await offsetResponse.json();
    strictEqual(jsonOffsetResponse.totalItemCount, originalActionCount + newActionCount);
    assert(jsonOffsetResponse.items instanceof Array);
    strictEqual(jsonOffsetResponse.items.length, 1);

  });

  it("can return a 400 if the query is invalid", async () => {

    // Grant unauthenticated users access to the action.
    await testEnvironment.createAccessPolicyForUnauthenticatedUsers("slashstep.actions.list");

    const sqlInjectionResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions?query=1 = 1; DROP access_policies CASCADE; select * from users`);
    strictEqual(sqlInjectionResponse.status, 400);

    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions?query=1`);
    strictEqual(numberResponse.status, 400);

    const unallowedKeyResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions?query=test = "test"`);
    strictEqual(unallowedKeyResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions`);
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to list actions", async () => {

    const user = await testEnvironment.createSlashstepUser();
    const session = await testEnvironment.createSlashstepSession(user.id);
    const sessionToken = await testEnvironment.createSlashstepSessionToken(session);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions`, {
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

})