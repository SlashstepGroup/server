import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { default as SlashstepServer } from "#utilities/Server/Server.js";
import getActionRouter from "./GET.js";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType, AccessPolicyScopedResourceType } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Session from "#resources/Session/Session.js";
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
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getActionAction = await Action.getByName("slashstep.actions.get", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getActionAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);
    
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${getActionAction.id}`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    strictEqual(jsonResponse.id, getActionAction.id);
    strictEqual(jsonResponse.name, getActionAction.name);
    strictEqual(jsonResponse.displayName, getActionAction.displayName);
    strictEqual(jsonResponse.description, getActionAction.description);
    strictEqual(jsonResponse.appID, getActionAction.appID);

  });
  
  it("can return a 400 if the access policy ID is not a UUID", async () => {

    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/1`);
    strictEqual(numberResponse.status, 400);

    const stringResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/not-a-uuid`);
    strictEqual(stringResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {

    const getActionsAction = await Action.getByName("slashstep.actions.get", slashstepServer.pool);
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${getActionsAction.id}`);
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to view the requested access policy", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getActionsAction = await Action.getByName("slashstep.actions.get", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getActionsAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const user = await User.create({
      username: TestEnvironment.generateRandomString(4),
      displayName: TestEnvironment.generateRandomString(16),
      hashedPassword: TestEnvironment.generateRandomString(64)
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

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${getActionsAction.id}`, {
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

  it("can return a 404 status code if the requested access policy doesn't exist", async () => {

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/actions/${generateUUIDv7()}`);
    strictEqual(response.status, 404);

  });

})