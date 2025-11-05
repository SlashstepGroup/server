import { Request, Response, Router } from "express";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import { ResponseLocals } from "#utilities/types.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";

const deleteAccessPolicyRouter = Router({mergeParams: true});
deleteAccessPolicyRouter.use(AuthenticationMiddleware.authenticateUser);
deleteAccessPolicyRouter.use(AuthenticationMiddleware.authenticateApp);
deleteAccessPolicyRouter.use(AuthenticationMiddleware.authenticateAppAuthorization);
deleteAccessPolicyRouter.use(AuthenticationMiddleware.storeAnonymousUser);
deleteAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }>, response: Response<unknown, ResponseLocals>) => {

  // Get the access policy.
  const { user, app, server, httpRequest } = response.locals;
  const { accessPolicyID } = request.params;
  await ServerLogEntry.create({
    message: `Getting access policy ${accessPolicyID}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  const deleteAccessPolicyAction: Action = await Action.getPreDefinedActionByName("slashstep.accessPolicies.delete", server.pool);
  const accessPolicy = await AccessPolicy.getByID(accessPolicyID, server.pool);

  // Make sure the requestor has permission to delete the access policy.
  await ServerLogEntry.create({
    message: `Verifying principal's permissions to delete access policy ${accessPolicy.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  const accessPolicyAction = await Action.getByID(accessPolicy.actionID, server.pool);
  const accessPolicyScopeData = await accessPolicy.getScopeData();
  const principal = app ?? user;
  HTTPTypeGuard.assertPrincipal(principal);
  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, deleteAccessPolicyAction.id, accessPolicyScopeData);
  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, accessPolicyAction.id, accessPolicyScopeData, AccessPolicyPermissionLevel.Editor);

  // Delete the access policy.
  await ServerLogEntry.create({
    message: `Deleting access policy ${accessPolicy.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  await accessPolicy.delete();

  // Log the action.
  await ActionLogEntry.create({
    actorType: principal.resourceType,
    actorUserID: principal.resourceType === "User" ? principal.id : null,
    actorAppID: principal.resourceType === "App" ? principal.id : null,
    httpRequestID: httpRequest.id,
    actionID: deleteAccessPolicyAction.id,
    targetResourceType: "AccessPolicy",
    targetAccessPolicyID: accessPolicy.id
  }, server.pool);

  await ServerLogEntry.create({
    message: `Successfully deleted access policy ${accessPolicy.id}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Success
  }, server.pool, true);

  response.sendStatus(204);

  await httpRequest.update({
    statusCode: 204
  });

});

export default deleteAccessPolicyRouter;