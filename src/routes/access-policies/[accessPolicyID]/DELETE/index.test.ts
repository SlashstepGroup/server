import { default as SlashstepServer } from "#utilities/Server/Server.js";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import deleteAccessPolicyRouter from "./index.js";
import { v7 as generateUUIDv7 } from "uuid";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType, AccessPolicyScopedResourceType } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Session from "#resources/Session/Session.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";

describe("Route: DELETE /access-policies/:id", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.delete("/access-policies/:accessPolicyID", deleteAccessPolicyRouter);
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

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.delete", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.Editor,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "DELETE"
    });
    strictEqual(response.status, 204);

  });

  it("can return a 400 if the access policy ID is not a UUID", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const deleteAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.delete", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: deleteAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

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
    
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.delete", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
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
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.delete", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
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

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "DELETE",
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

  it("can return a 404 status code if the requested access policy doesn't exist", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.delete", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${generateUUIDv7()}`, {
      method: "DELETE"
    });
    strictEqual(response.status, 404);

  });

})