import { default as SlashstepServer } from "#resources/Server/Server.js";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import deleteAppAuthorizationRouter from "./DELETE.js";
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
import AppAuthorization, { AppAuthorizationAuthorizingResourceType } from "#resources/AppAuthorization/AppAuthorization.js";

describe("Route: DELETE /access-policies/:accessPolicyID", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.delete("/app-authorizations/:appAuthorizationID", deleteAppAuthorizationRouter);
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

    await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.appAuthorizations.delete");

    const randomUser = await testEnvironment.createSlashstepUser();
    const randomApp = await testEnvironment.createRandomApp();
    const appAuthorization = await AppAuthorization.create({
      appID: randomApp.id,
      authorizingResourceType: AppAuthorizationAuthorizingResourceType.User,
      authorizingUserID: randomUser.id
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorizations/${appAuthorization.id}`, {
      method: "DELETE"
    });
    strictEqual(response.status, 204);

    await rejects(async () => await AppAuthorization.getByID(appAuthorization.id, slashstepServer.pool), ResourceNotFoundError);

  });

    it("can create an action log for a successful delete", async () => {

      await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.appAuthorizations.delete");

      const randomUser = await testEnvironment.createSlashstepUser();
      const randomApp = await testEnvironment.createRandomApp();
      const appAuthorization = await AppAuthorization.create({
        appID: randomApp.id,
        authorizingResourceType: AppAuthorizationAuthorizingResourceType.User,
        authorizingUserID: randomUser.id
      }, slashstepServer.pool);

      await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorizations/${appAuthorization.id}`, {
        method: "DELETE"
      });

      const deleteAppAuthorizationAction = await Action.getByName("slashstep.appAuthorizations.delete", slashstepServer.pool);
      const actionLogCount = await ActionLogEntry.count(`actionID = "${deleteAppAuthorizationAction.id}" and targetAppAuthorizationID = "${appAuthorization.id}"`, slashstepServer.pool);
      strictEqual(actionLogCount, 1);

    });

    it("can return a 400 if the access policy ID is not a UUID", async () => {

      await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.appAuthorizations.delete");

      const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorizations/1`, {
        method: "DELETE"
      });
      strictEqual(numberResponse.status, 400);

      const stringResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorizations/not-a-uuid`, {
        method: "DELETE"
      });
      strictEqual(stringResponse.status, 400);

    });

    it("can return a 401 status code if the user needs authentication", async () => {
      
      const randomUser = await testEnvironment.createSlashstepUser();
      const randomApp = await testEnvironment.createRandomApp();
      const appAuthorization = await AppAuthorization.create({
        appID: randomApp.id,
        authorizingResourceType: AppAuthorizationAuthorizingResourceType.User,
        authorizingUserID: randomUser.id
      }, slashstepServer.pool);

      const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorizations/${appAuthorization.id}`, {
        method: "DELETE"
      });
      strictEqual(response.status, 401);

    });

    it("can return a 403 status code if the user doesn't have permission to delete the requested access policy", async () => {

      // Grant unauthenticated users access to the action.
      const randomUser = await testEnvironment.createSlashstepUser();
      const randomApp = await testEnvironment.createRandomApp();
      const appAuthorization = await AppAuthorization.create({
        appID: randomApp.id,
        authorizingResourceType: AppAuthorizationAuthorizingResourceType.User,
        authorizingUserID: randomUser.id
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

      const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorizations/${appAuthorization.id}`, {
        method: "DELETE",
        headers: {
          cookie: `sessionToken=${sessionToken}`
        },
      });
      
      strictEqual(response.status, 403);

    });

    it("can return a 404 status code if the requested access policy doesn't exist", async () => {

      await testEnvironment.createAccessPolicyForAnonymousUsers("slashstep.appAuthorizations.delete");

      const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorizations/${generateUUIDv7()}`, {
        method: "DELETE"
      });
      strictEqual(response.status, 404);

    });

})