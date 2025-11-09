import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { default as SlashstepServer } from "#resources/Server/Server.js";
import getActionLogEntryRouter from "./GET.js";
import { v7 as generateUUIDv7 } from "uuid";
import User from "#resources/User/User.js";
import Session from "#resources/Session/Session.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import { BaseActionLogEntryProperties } from "#resources/ActionLogEntry/ActionLogEntry.js";

describe("Route: GET /action-log-entries/:actionLogEntryID", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.get("/action-log-entries/:actionLogEntryID", getActionLogEntryRouter);
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

  it("can return a 200 status code and the requested action log entry", {timeout: 2000}, async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.actionLogEntries.get");

    const actionLogEntry = await testEnvironment.createRandomActionLogEntry();

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries/${actionLogEntry.id}`);
    strictEqual(response.status, 200);

    const jsonResponse: BaseActionLogEntryProperties = await response.json();
    strictEqual(actionLogEntry.id, jsonResponse.id);
    strictEqual(actionLogEntry.actorAppID, jsonResponse.actorAppID);
    strictEqual(actionLogEntry.actorUserID, jsonResponse.actorUserID);
    strictEqual(actionLogEntry.actionID, jsonResponse.actionID);
    strictEqual(actionLogEntry.httpRequestID, jsonResponse.httpRequestID);
    strictEqual(actionLogEntry.targetResourceType, jsonResponse.targetResourceType);
    strictEqual(actionLogEntry.targetAccessPolicyID, jsonResponse.targetAccessPolicyID);
    strictEqual(actionLogEntry.targetActionID, jsonResponse.targetActionID);
    strictEqual(actionLogEntry.targetActionLogEntryID, jsonResponse.targetActionLogEntryID);
    strictEqual(actionLogEntry.targetAppID, jsonResponse.targetAppID);
    strictEqual(actionLogEntry.targetAppAuthorizationID, jsonResponse.targetAppAuthorizationID);
    strictEqual(actionLogEntry.targetAppAuthorizationCredentialID, jsonResponse.targetAppAuthorizationCredentialID);
    strictEqual(actionLogEntry.targetAppCredentialID, jsonResponse.targetAppCredentialID);
    strictEqual(actionLogEntry.targetFieldID, jsonResponse.targetFieldID);
    strictEqual(actionLogEntry.targetGroupID, jsonResponse.targetGroupID);
    strictEqual(actionLogEntry.targetItemID, jsonResponse.targetItemID);
    strictEqual(actionLogEntry.targetItemConnectionID, jsonResponse.targetItemConnectionID);
    strictEqual(actionLogEntry.targetItemConnectionTypeID, jsonResponse.targetItemConnectionTypeID);
    strictEqual(actionLogEntry.targetMilestoneID, jsonResponse.targetMilestoneID);
    strictEqual(actionLogEntry.targetProjectID, jsonResponse.targetProjectID);
    strictEqual(actionLogEntry.targetRoleID, jsonResponse.targetRoleID);
    strictEqual(actionLogEntry.targetSessionID, jsonResponse.targetSessionID);
    strictEqual(actionLogEntry.targetUserID, jsonResponse.targetUserID);
    strictEqual(actionLogEntry.targetWorkspaceID, jsonResponse.targetWorkspaceID);
    strictEqual(actionLogEntry.reason, jsonResponse.reason);
    strictEqual(actionLogEntry.errorMessage, jsonResponse.errorMessage);

  });

  it("can return a 400 if the action log entry ID is not a UUID", {timeout: 2000}, async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.actionLogEntries.get");

    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries/1`);
    strictEqual(numberResponse.status, 400);

    const stringResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries/not-a-uuid`);
    strictEqual(stringResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication to view the requested action log entry", {timeout: 2000}, async () => {

    const actionLogEntry = await testEnvironment.createRandomActionLogEntry();
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries/${actionLogEntry.id}`);
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to view the requested action log entry", {timeout: 2000}, async () => {

    const actionLogEntry = await testEnvironment.createRandomActionLogEntry();

    const user = await User.create({
      username: TestEnvironment.generateRandomString(4),
      displayName: TestEnvironment.generateRandomString(16),
      hashedPassword: TestEnvironment.generateRandomString(64),
      isAnonymous: false
    }, slashstepServer.pool);

    const session = await Session.create({
      userID: user.id,
      expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      creationIP: "127.0.0.1"
    }, slashstepServer.pool);
    
    const jwtPrivateKey = await slashstepServer.getJWTPrivateKey();

    const sessionToken = Session.generateJSONWebToken({
      userID: session.userID,
      sessionID: session.id
    }, jwtPrivateKey);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries/${actionLogEntry.id}`, {
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

  it("can return a 404 status code if the requested action log entry doesn't exist", {timeout: 2000}, async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.actionLogEntries.get");

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries/${generateUUIDv7()}`);
    strictEqual(response.status, 404);

  });

})