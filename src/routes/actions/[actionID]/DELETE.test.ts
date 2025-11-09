import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { default as SlashstepServer } from "#resources/Server/Server.js";
import deleteActionRouter from "./DELETE.js";
import Action from "#resources/Action/Action.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import { v7 as generateUUIDv7 } from "uuid";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { rejects } from "node:assert/strict";

describe("Route: DELETE /actions/:actionID", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.delete("/actions/:actionID", deleteActionRouter);
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

  it("can return a 204 status code and the requested action", async () => {

    const app = await testEnvironment.createRandomApp();
    const action = await testEnvironment.createRandomAction({appID: app.id});
    const appCredential = await testEnvironment.createSlashstepAppCredential(app.id);
    const token = await testEnvironment.createSlashstepAppCredentialToken(appCredential);
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${action.id}`, {
      method: "DELETE",
      headers: {
        authorization: `App ${token}`
      },
      credentials: "include"
    });

    strictEqual(response.status, 204);
    await rejects(async () => await Action.getByID(action.id, slashstepServer.pool), ResourceNotFoundError);

  });
  
  it("can return a 400 if the access policy ID is not a UUID", async () => {

    const app = await testEnvironment.createRandomApp();
    const appCredential = await testEnvironment.createSlashstepAppCredential(app.id);
    const token = await testEnvironment.createSlashstepAppCredentialToken(appCredential);
    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/1`, {
      method: "DELETE",
      headers: {
        authorization: `App ${token}`
      },
      credentials: "include"
    });
    strictEqual(numberResponse.status, 400);

    const stringResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/not-a-uuid`, {
      method: "DELETE",
      headers: {
        authorization: `App ${token}`
      },
      credentials: "include"
    });
    strictEqual(stringResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {

    const action = await testEnvironment.createRandomAction();
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${action.id}`, {
      method: "DELETE"
    });
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the app doesn't have permission to delete the requested action", async () => {

    const app = await testEnvironment.createRandomApp();
    const action = await testEnvironment.createRandomAction();
    const appCredential = await testEnvironment.createSlashstepAppCredential(app.id);
    const token = await testEnvironment.createSlashstepAppCredentialToken(appCredential);
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${action.id}`, {
      method: "DELETE",
      headers: {
        authorization: `App ${token}`
      },
      credentials: "include"
    });
    
    strictEqual(response.status, 403);

  });

  it("can return a 404 status code if the requested access policy doesn't exist", async () => {

    const app = await testEnvironment.createRandomApp();
    const appCredential = await testEnvironment.createSlashstepAppCredential(app.id);
    const token = await testEnvironment.createSlashstepAppCredentialToken(appCredential);
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${generateUUIDv7()}`, {
      method: "DELETE",
      headers: {
        authorization: `App ${token}`
      },
      credentials: "include"
    });
    strictEqual(response.status, 404);

  });

})