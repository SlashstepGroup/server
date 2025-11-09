import { default as SlashstepServer } from "#resources/Server/Server.js";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import deleteAccessPolicyRouter from "./DELETE.js";
import { v7 as generateUUIDv7 } from "uuid";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType, AccessPolicyScopedResourceType } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Session from "#resources/Session/Session.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { rejects } from "node:assert/strict";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";

describe("Route: DELETE /access-policies/:accessPolicyID", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.delete("/access-policies/:accessPolicyID", deleteAccessPolicyRouter);
    slashstepServer.setupErrorHandling();
    await testEnvironment.initializeHTTPServer();

  });

  beforeEach(async () => {

    await slashstepServer.initializeResourceTables();
    await slashstepServer.initializePreDefinedResources();

  });

  afterEach(async () => {

    await testEnvironment.resetPostgreSQLSchema();

  });

  after(async () => {

    await testEnvironment.destroy();

  })

  it("can return a 204 status code if successful", async () => {

    const anonymousUsersRole = await Role.getByName("anonymous-users", slashstepServer.pool);
    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.accessPolicies.delete");

    const randomAction = await testEnvironment.createRandomAction();
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: anonymousUsersRole.id,
      actionID: randomAction.id,
      permissionLevel: AccessPolicyPermissionLevel.Editor,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool)

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "DELETE"
    });
    strictEqual(response.status, 204);

    await rejects(async () => await AccessPolicy.getByID(accessPolicy.id, slashstepServer.pool), ResourceNotFoundError);

  });

  it("can create an action log for a successful delete", async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.accessPolicies.delete");

    const randomAction = await testEnvironment.createRandomAction();
    const anonymousUsersRole = await Role.getByName("anonymous-users", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: anonymousUsersRole.id,
      actionID: randomAction.id,
      permissionLevel: AccessPolicyPermissionLevel.Editor,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool)

    await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "DELETE"
    });

    const deleteAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.delete", slashstepServer.pool);
    const actionLogCount = await ActionLogEntry.count(`actionID = "${deleteAccessPolicyAction.id}" and targetAccessPolicyID = "${accessPolicy.id}"`, slashstepServer.pool);
    strictEqual(actionLogCount, 1);

  });

  it("can return a 400 if the access policy ID is not a UUID", async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.accessPolicies.delete");

    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/1`, {
      method: "DELETE"
    });
    strictEqual(numberResponse.status, 400);

    const stringResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/not-a-uuid`, {
      method: "DELETE"
    });
    strictEqual(stringResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {
    
    const anonymousUsersRole = await Role.getByName("anonymous-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.delete", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: anonymousUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.None,
      inheritanceLevel: AccessPolicyInheritanceLevel.Disabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "DELETE"
    });
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to delete the requested access policy", async () => {

    // Grant unauthenticated users access to the action.
    const anonymousUsersRole = await Role.getByName("anonymous-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.delete", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: anonymousUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

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

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "DELETE",
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

  it("can return a 404 status code if the requested access policy doesn't exist", async () => {

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.accessPolicies.delete");

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${generateUUIDv7()}`, {
      method: "DELETE"
    });
    strictEqual(response.status, 404);

  });

})