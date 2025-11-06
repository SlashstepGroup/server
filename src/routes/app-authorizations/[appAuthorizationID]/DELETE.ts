import { Request, Response, Router } from "express";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import { ResponseLocals } from "#utilities/types.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";
import AppAuthorization from "#resources/AppAuthorization/AppAuthorization.js";
import Project from "#resources/Project/Project.js";

const deleteAppAuthorizationRouter = Router({mergeParams: true});
deleteAppAuthorizationRouter.use(AuthenticationMiddleware.authenticateUser);
deleteAppAuthorizationRouter.use(AuthenticationMiddleware.authenticateApp);
deleteAppAuthorizationRouter.use(AuthenticationMiddleware.authenticateAppAuthorization);
deleteAppAuthorizationRouter.use(AuthenticationMiddleware.storeAnonymousUser);
deleteAppAuthorizationRouter.use(async (request: Request<{ appAuthorizationID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server, httpRequest } = response.locals;
  const { appAuthorizationID } = request.params;
  await ServerLogEntry.create({
    message: `Getting app authorization ${appAuthorizationID}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  const appAuthorization = await AppAuthorization.getByID(appAuthorizationID, server.pool);

  // Make sure the requestor has permission to delete the app authorization.
  await ServerLogEntry.create({
    message: `Verifying principal's permissions to delete app authorization ${appAuthorization.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  const deleteAppAuthorizationAction = await Action.getPreDefinedActionByName("slashstep.appAuthorizations.delete", server.pool);
  const accessPolicyScopeData = await appAuthorization.getScopeData({Project});
  const principal = app ?? user;
  HTTPTypeGuard.assertPrincipal(principal);
  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, deleteAppAuthorizationAction.id, accessPolicyScopeData);

  // Delete the app authorization.
  await ServerLogEntry.create({
    message: `Deleting app authorization ${appAuthorization.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  await appAuthorization.delete();

  // Log the action.
  await ActionLogEntry.create({
    actorType: principal.resourceType,
    actorUserID: principal.resourceType === "User" ? principal.id : null,
    actorAppID: principal.resourceType === "App" ? principal.id : null,
    httpRequestID: httpRequest.id,
    actionID: deleteAppAuthorizationAction.id,
    targetResourceType: "AppAuthorization",
    targetAppAuthorizationID: appAuthorization.id
  }, server.pool);

  await ServerLogEntry.create({
    message: `Successfully deleted app authorization ${appAuthorization.id}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Success
  }, server.pool, true);

  response.sendStatus(204);

  await httpRequest.update({
    statusCode: 204
  });

});

export default deleteAppAuthorizationRouter;