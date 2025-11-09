import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { default as SlashstepServer } from "#resources/Server/Server.js";
import createAppAuthorizationCredentialRouter from "./POST.js";
import Action from "#resources/Action/Action.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import OAuthAuthorizationRequest from "#resources/OAuthAuthorizationRequest/OAuthAuthorizationRequest.js";
import StringEncryptor from "#utilities/StringEncryptor/StringEncryptor.js";
import AppAuthorization from "#resources/AppAuthorization/AppAuthorization.js";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType, AccessPolicyScopedResourceType } from "#resources/AccessPolicy/AccessPolicy.js";
import { createHash } from "crypto";

describe("Route: POST /app-authorization-credentials", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.post("/app-authorization-credentials", createAppAuthorizationCredentialRouter);
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

  it("can return a 201 status code and the requested app authorization credential when using an authorization code", async () => {

    const app = await testEnvironment.createRandomApp();
    const appAuthorization = await AppAuthorization.create({
      appID: app.id,
      authorizingResourceType: "Instance"
    }, slashstepServer.pool);
    const decryptedCode = TestEnvironment.generateRandomString(64);
    const privateKey = await slashstepServer.getJWTPrivateKey();
    const encryptedCode = StringEncryptor.encryptString(decryptedCode, privateKey);
    await OAuthAuthorizationRequest.create({
      appAuthorizationID: appAuthorization.id,
      encryptedCode,
      expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      appID: app.id
    }, {
      pool: slashstepServer.pool
    });

    const createAppAuthorizationCredentialAction = await Action.getByName("slashstep.appAuthorizationCredentials.create", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.App,
      principalAppID: app.id,
      actionID: createAppAuthorizationCredentialAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Disabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorization-credentials`, {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: app.id,
        code: decryptedCode
      })
    });

    strictEqual(response.status, 201);
    const jsonResponse = await response.json();
    strictEqual(typeof(jsonResponse.access_token), "string");
    strictEqual(typeof(jsonResponse.refresh_token), "string");
    strictEqual(typeof(jsonResponse.token_type), "string");
    strictEqual(typeof(jsonResponse.expires_in), "number");
    strictEqual(typeof(jsonResponse.refresh_token_expires_in), "number");

  });

    it("can return a 201 status code and the requested app authorization credential when using an authorization code and code_verifier", async () => {

    const app = await testEnvironment.createRandomApp();
    const appAuthorization = await AppAuthorization.create({
      appID: app.id,
      authorizingResourceType: "Instance"
    }, slashstepServer.pool);
    const codeVerifier = TestEnvironment.generateRandomString(64);
    const codeChallengeHash = createHash("sha256").update(codeVerifier).digest("base64");
    const codeChallenge = Buffer.from(codeChallengeHash).toString("base64");
    const decryptedCode = TestEnvironment.generateRandomString(64);
    const privateKey = await slashstepServer.getJWTPrivateKey();
    const encryptedCode = StringEncryptor.encryptString(decryptedCode, privateKey);
    await OAuthAuthorizationRequest.create({
      appAuthorizationID: appAuthorization.id,
      encryptedCode,
      expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      appID: app.id,
      codeChallenge
    }, {
      pool: slashstepServer.pool
    });

    const createAppAuthorizationCredentialAction = await Action.getByName("slashstep.appAuthorizationCredentials.create", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.App,
      principalAppID: app.id,
      actionID: createAppAuthorizationCredentialAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Disabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/app-authorization-credentials`, {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: app.id,
        code: decryptedCode,
        code_verifier: codeVerifier
      })
    });

    strictEqual(response.status, 201);
    const jsonResponse = await response.json();
    strictEqual(typeof(jsonResponse.access_token), "string");
    strictEqual(typeof(jsonResponse.refresh_token), "string");
    strictEqual(typeof(jsonResponse.token_type), "string");
    strictEqual(typeof(jsonResponse.expires_in), "number");
    strictEqual(typeof(jsonResponse.refresh_token_expires_in), "number");

  });

})