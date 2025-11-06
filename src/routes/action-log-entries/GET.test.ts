import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { default as SlashstepServer } from "#utilities/Server/Server.js";
import getAccessPolicyRouter from "./GET.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import User from "#resources/User/User.js";
import Session from "#resources/Session/Session.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import ActionLogEntry, { BaseActionLogEntryProperties } from "#resources/ActionLogEntry/ActionLogEntry.js";

describe("Route: GET /action-log-entries", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.get("/action-log-entries", getAccessPolicyRouter);
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

  it("can return a 200 status code and the requested action log entries", async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.actionLogEntries.list");
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    strictEqual(typeof(jsonResponse.totalItemCount), "number");
    strictEqual(jsonResponse.items instanceof Array, true);
    
    // Test query filtering.
    const actionLogEntry = await testEnvironment.createRandomActionLogEntry();
    const accessPolicyResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries?query=id = "${actionLogEntry.id}"`);
    strictEqual(accessPolicyResponse.status, 200);

    const accessPolicyJSONResponse: {totalItemCount: number, items: BaseActionLogEntryProperties[]} = await accessPolicyResponse.json();
    strictEqual(accessPolicyJSONResponse.totalItemCount, 1);
    strictEqual(accessPolicyJSONResponse.items instanceof Array, true);
    strictEqual(accessPolicyJSONResponse.items[0].id, actionLogEntry.id);
    strictEqual(accessPolicyJSONResponse.items[0].actorAppID, actionLogEntry.actorAppID);
    strictEqual(accessPolicyJSONResponse.items[0].actorUserID, actionLogEntry.actorUserID);
    strictEqual(accessPolicyJSONResponse.items[0].actionID, actionLogEntry.actionID);
    strictEqual(accessPolicyJSONResponse.items[0].httpRequestID, actionLogEntry.httpRequestID);
    strictEqual(accessPolicyJSONResponse.items[0].targetResourceType, actionLogEntry.targetResourceType);
    strictEqual(accessPolicyJSONResponse.items[0].targetAccessPolicyID, actionLogEntry.targetAccessPolicyID);
    strictEqual(accessPolicyJSONResponse.items[0].targetActionID, actionLogEntry.targetActionID);
    strictEqual(accessPolicyJSONResponse.items[0].targetActionLogEntryID, actionLogEntry.targetActionLogEntryID);
    strictEqual(accessPolicyJSONResponse.items[0].targetAppID, actionLogEntry.targetAppID);
    strictEqual(accessPolicyJSONResponse.items[0].targetAppAuthorizationID, actionLogEntry.targetAppAuthorizationID);
    strictEqual(accessPolicyJSONResponse.items[0].targetAppAuthorizationCredentialID, actionLogEntry.targetAppAuthorizationCredentialID);
    strictEqual(accessPolicyJSONResponse.items[0].targetAppCredentialID, actionLogEntry.targetAppCredentialID);
    strictEqual(accessPolicyJSONResponse.items[0].targetFieldID, actionLogEntry.targetFieldID);
    strictEqual(accessPolicyJSONResponse.items[0].targetGroupID, actionLogEntry.targetGroupID);
    strictEqual(accessPolicyJSONResponse.items[0].targetItemID, actionLogEntry.targetItemID);
    strictEqual(accessPolicyJSONResponse.items[0].targetItemConnectionID, actionLogEntry.targetItemConnectionID);
    strictEqual(accessPolicyJSONResponse.items[0].targetItemConnectionTypeID, actionLogEntry.targetItemConnectionTypeID);
    strictEqual(accessPolicyJSONResponse.items[0].targetMilestoneID, actionLogEntry.targetMilestoneID);
    strictEqual(accessPolicyJSONResponse.items[0].targetProjectID, actionLogEntry.targetProjectID);
    strictEqual(accessPolicyJSONResponse.items[0].targetRoleID, actionLogEntry.targetRoleID);
    strictEqual(accessPolicyJSONResponse.items[0].targetSessionID, actionLogEntry.targetSessionID);
    strictEqual(accessPolicyJSONResponse.items[0].targetUserID, actionLogEntry.targetUserID);
    strictEqual(accessPolicyJSONResponse.items[0].targetWorkspaceID, actionLogEntry.targetWorkspaceID);
    strictEqual(accessPolicyJSONResponse.items[0].reason, actionLogEntry.reason);
    strictEqual(accessPolicyJSONResponse.items[0].errorMessage, actionLogEntry.errorMessage);

  });

  it("can return up to 1,000 access policies by default", async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.actionLogEntries.list");
    const originalAccessPolicyCount = await ActionLogEntry.count("", slashstepServer.pool);
    const newActionLogEntryCount = Math.max(0, 1001 - originalAccessPolicyCount);
    const actionLogEntries = [];
    for (let i = 0; newActionLogEntryCount > i; i++) {

      const actionLogEntry = await testEnvironment.createRandomActionLogEntry();
      actionLogEntries.push(actionLogEntry);

    }
    
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    strictEqual(jsonResponse.totalItemCount > 1000, true);
    strictEqual(jsonResponse.items instanceof Array, true);
    strictEqual(jsonResponse.items.length, 1000);
    
  });

  it("can return a 400 if the query is invalid", async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.actionLogEntries.list");

    const sqlInjectionResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries?query=1 = 1; DROP access_policies CASCADE; select * from users`);
    strictEqual(sqlInjectionResponse.status, 400);

    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries?query=1`);
    strictEqual(numberResponse.status, 400);

    const unallowedKeyResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries?query=test = "test"`);
    strictEqual(unallowedKeyResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries`);
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to list access policies", async () => {

    // Grant unauthenticated users access to the action.
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

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/action-log-entries`, {
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

})