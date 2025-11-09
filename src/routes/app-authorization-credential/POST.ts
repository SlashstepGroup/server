import { Request, Response, Router } from "express";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import { ResponseLocals } from "#utilities/types.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";
import AppAuthorization from "#resources/AppAuthorization/AppAuthorization.js";
import Project from "#resources/Project/Project.js";
import AppAuthorizationCredential from "#resources/AppAuthorizationCredential/AppAuthorizationCredential.js";
import BadRequestError from "#errors/BadRequestError.js";
import HTTPInputValidator from "#utilities/HTTPInputValidator/HTTPInputValidator.js";
import { urlencoded } from "express";
import App, { AppClientType } from "#resources/App/App.js";
import { verify } from "argon2";
import ForbiddenError from "#errors/ForbiddenError.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import { createHash } from "crypto";
import OAuthAuthorizationRequest from "#resources/OAuthAuthorizationRequest/OAuthAuthorizationRequest.js";
import ServerPolicy from "#resources/ServerPolicy/ServerPolicy.js";
import HTTPRequest from "#resources/HTTPRequest/HTTPRequest.js";
import { Pool } from "pg";
import InternalServerError from "#errors/InternalServerError.js";
import jsonwebtoken from "jsonwebtoken";
import Server from "#resources/Server/Server.js";

async function getAppAuthorizationFromOAuthAuthorizationCode(client_id: unknown, code: unknown, code_verifier: unknown, privateKey: string, httpRequest: HTTPRequest, pool: Pool): Promise<AppAuthorization> {

  await ServerLogEntry.create({
    message: "Searching for OAuth authorization request...",
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, pool, true);
  
  HTTPInputValidator.verifyString("client_id", client_id, {isRequired: true});
  HTTPInputValidator.verifyString("code", code, {isRequired: true});
  const oauthAuthorizationRequest = await OAuthAuthorizationRequest.getByDecryptedCode(code, client_id, privateKey, {pool});

  await ServerLogEntry.create({
    message: `Found OAuth authorization request ${oauthAuthorizationRequest.id}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Info
  }, pool, true);

  await ServerLogEntry.create({
    message: "Removing code from OAuth authorization request...",
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, pool, true);
  
  await oauthAuthorizationRequest.update({
    encryptedCode: null
  });

  if (oauthAuthorizationRequest.codeChallenge) {

    await ServerLogEntry.create({
      message: "Verifying code_verifier...",
      httpRequestID: httpRequest.id,
      level: ServerLogEntryLevel.Trace
    }, pool, true);

    HTTPInputValidator.verifyString("code_verifier", code_verifier, {isRequired: true});

    const codeVerifierHash = createHash("sha256").update(code_verifier).digest("base64");
    if (codeVerifierHash !== oauthAuthorizationRequest.codeChallenge) {

      throw new UnauthenticatedError("The code verifier is incorrect.");

    }

  }

  await ServerLogEntry.create({
    message: "Getting app authorization...",
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, pool, true);

  const appAuthorization = await AppAuthorization.getByID(oauthAuthorizationRequest.appAuthorizationID, pool);
  return appAuthorization;

}

async function getAppAuthorizationCredentialFromRefreshToken(refresh_token: unknown, httpRequest: HTTPRequest, server: Server): Promise<AppAuthorizationCredential> {

  HTTPInputValidator.verifyString("refresh_token", refresh_token, {isRequired: true});

  const { pool } = server;
  await ServerLogEntry.create({
    message: "Getting app authorization credential from refresh token...",
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, pool, true);

  try {

    const jwtPublicKey = await server.getJWTPublicKey();

    const jsonWebToken = jsonwebtoken.verify(refresh_token, jwtPublicKey, {
      algorithms: ["RS256"]
    });

    if (typeof(jsonWebToken) !== "object") {

      throw new BadRequestError("The refresh token is not a JSON object.");

    }

    if (jsonWebToken.tokenType !== "Refresh") {

      throw new BadRequestError("The refresh token is not a refresh token.");

    }

    if (!jsonWebToken.jti) {

      throw new BadRequestError("The refresh token is missing the app authorization credential ID.");

    }

    const currentAppAuthorizationCredential = await AppAuthorizationCredential.getByID(jsonWebToken.jti, {pool});
    if (currentAppAuthorizationCredential.refreshedAppAuthorizationCredentialID) {

      throw new BadRequestError("That refresh token has already been used.");

    }

    return currentAppAuthorizationCredential;

  } catch (error) {

    if (error instanceof jsonwebtoken.JsonWebTokenError) {

      throw new BadRequestError("The refresh token is invalid.");

    }

    throw error;

  }

}

async function checkClientSecret(app: App, client_secret: unknown, httpRequest: HTTPRequest, pool: Pool): Promise<void> {

  if (app.clientType === AppClientType.Confidential) {

    await ServerLogEntry.create({
      message: "Verifying client secret...",
      httpRequestID: httpRequest.id,
      level: ServerLogEntryLevel.Trace
    }, pool, true);

    HTTPInputValidator.verifyString("client_secret", client_secret, {isRequired: true});
    
    const clientSecretHash = app.getClientSecretHash();
    if (!clientSecretHash) {

      throw new ForbiddenError("The app's client secret needs to be initialized before it can be used.");

    }

    const doesClientSecretMatch = await verify(client_secret, clientSecretHash);
    if (!doesClientSecretMatch) {

      throw new UnauthenticatedError("The client secret is incorrect.");

    }

  }

}

async function verifyAppPermissions(app: App, appAuthorization: AppAuthorization, httpRequest: HTTPRequest, pool: Pool, actionID: string): Promise<void> {

  await ServerLogEntry.create({
    message: `Verifying principal's permissions to create a credential for app authorization ${appAuthorization.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, pool, true);

  const appAuthorizationScopeData = await appAuthorization.getScopeData({Project});
  await app.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, actionID, appAuthorizationScopeData);

}

async function createAppAuthorizationCredential(appAuthorization: AppAuthorization, httpRequest: HTTPRequest, pool: Pool): Promise<AppAuthorizationCredential> {

  await ServerLogEntry.create({
    message: `Creating a credential for app authorization ${appAuthorization.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, pool, true);

  const accessTokenExpirationMillisecondsServerPolicy = await ServerPolicy.getByName("app-authorization-credential-access-token-expiration-milliseconds", pool);
  const accessTokenExpirationMilliseconds = accessTokenExpirationMillisecondsServerPolicy.getNumberValue();
  const refreshTokenExpirationMillisecondsServerPolicy = await ServerPolicy.getByName("app-authorization-credential-refresh-token-expiration-milliseconds", pool);
  const refreshTokenExpirationMilliseconds = refreshTokenExpirationMillisecondsServerPolicy.getNumberValue();
  const appAuthorizationCredential = await AppAuthorizationCredential.create({
    appAuthorizationID: appAuthorization.id,
    accessTokenExpirationDate: new Date(Date.now() + accessTokenExpirationMilliseconds),
    refreshTokenExpirationDate: new Date(Date.now() + refreshTokenExpirationMilliseconds)
  }, pool);

  return appAuthorizationCredential;

}

function verifyGrantType(grant_type: unknown): asserts grant_type is "authorization_code" | "refresh_token" {

  if (grant_type !== "authorization_code" && grant_type !== "refresh_token") {

    throw new BadRequestError(`The grant type must be "authorization_code" or "refresh_token".`);

  }

}

const createAppAuthorizationCredentialRouter = Router({mergeParams: true});
createAppAuthorizationCredentialRouter.use(urlencoded({ extended: true }));
createAppAuthorizationCredentialRouter.use(async (request: Request<void, unknown, {grant_type: unknown, client_id: unknown, client_secret: unknown, refresh_token: unknown, code: unknown, code_verifier: unknown}>, response: Response<unknown, ResponseLocals>) => {

  const { server, httpRequest } = response.locals;
  const { grant_type, client_id, client_secret, refresh_token, code, code_verifier } = request.body;

  verifyGrantType(grant_type);

  const currentAppAuthorizationCredential = grant_type === "refresh_token" ? await getAppAuthorizationCredentialFromRefreshToken(refresh_token, httpRequest, server) : null;
  const privateKey = await server.getJWTPrivateKey();
  const appAuthorization = currentAppAuthorizationCredential ? await AppAuthorization.getByID(currentAppAuthorizationCredential.appAuthorizationID, server.pool) : await getAppAuthorizationFromOAuthAuthorizationCode(client_id, code, code_verifier, privateKey, httpRequest, server.pool);
  
  // Check if the app needs client secret verification.
  const app = await App.getByID(appAuthorization.appID, server.pool);
  await checkClientSecret(app, client_secret, httpRequest, server.pool);

  // Verify the app's permissions.
  const createAppAuthorizationCredentialAction = await Action.getPreDefinedActionByName("slashstep.appAuthorizationCredentials.create", server.pool);
  await verifyAppPermissions(app, appAuthorization, httpRequest, server.pool, createAppAuthorizationCredentialAction.id);

  // Create and return the app authorization credential.
  const appAuthorizationCredential = await createAppAuthorizationCredential(appAuthorization, httpRequest, server.pool);

  await ActionLogEntry.create({
    actorType: app.resourceType,
    actorAppID: app.id,
    httpRequestID: httpRequest.id,
    actionID: createAppAuthorizationCredentialAction.id,
    targetResourceType: "AppAuthorizationCredential",
    targetAppAuthorizationCredentialID: appAuthorizationCredential.id
  }, server.pool);

  if (currentAppAuthorizationCredential) {

    await currentAppAuthorizationCredential.update({
      refreshedAppAuthorizationCredentialID: appAuthorizationCredential.id
    });

  }

  response.status(201).json({
    ...appAuthorizationCredential,
    access_token: appAuthorizationCredential.generateAccessToken(privateKey, `${appAuthorizationCredential.accessTokenExpirationDate.getTime() - Date.now()} ms`),
    refresh_token: appAuthorizationCredential.generateRefreshToken(privateKey, `${appAuthorizationCredential.refreshTokenExpirationDate.getTime() - Date.now()} ms`),
    token_type: "Bearer",
    expires_in: appAuthorizationCredential.accessTokenExpirationDate.getTime() - Date.now(),
    refresh_token_expires_in: appAuthorizationCredential.refreshTokenExpirationDate.getTime() - Date.now()
  });

  await ServerLogEntry.create({
    message: `Successfully created app authorization credential for app authorization ${appAuthorization.id}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Success
  }, server.pool, true);

  await httpRequest.update({
    statusCode: 201
  });

});

export default createAppAuthorizationCredentialRouter;