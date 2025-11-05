import { Request, Response, Router } from "express";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import { ResponseLocals } from "#utilities/types.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";
import BadRequestError from "#errors/BadRequestError.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";

const updateAccessPolicyRouter = Router({mergeParams: true});
updateAccessPolicyRouter.use(AuthenticationMiddleware.authenticateUser);
updateAccessPolicyRouter.use(AuthenticationMiddleware.authenticateApp);
updateAccessPolicyRouter.use(AuthenticationMiddleware.authenticateAppAuthorization);
updateAccessPolicyRouter.use(AuthenticationMiddleware.storeAnonymousUser);
updateAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }, unknown, {inheritanceLevel: unknown, permissionLevel: unknown} | undefined>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server, httpRequest } = response.locals;

  // Make sure the access policy exists.
  const { accessPolicyID } = request.params;
  await ServerLogEntry.create({
    message: `Getting access policy ${accessPolicyID}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  const accessPolicy = await AccessPolicy.getByID(accessPolicyID, server.pool);
  const accessPolicyAction = await Action.getByID(accessPolicy.actionID, server.pool);

  // Make sure the user has permission to view the access policy.
  await ServerLogEntry.create({
    message: `Verifying principal's permissions to get access policy ${accessPolicy.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);
  const accessPolicyScopeData = await accessPolicy.getScopeData();
  const updateAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.update", server.pool);
  const principal = user ?? app;
  HTTPTypeGuard.assertPrincipal(principal);

  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, updateAccessPolicyAction.id, accessPolicyScopeData);
  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, accessPolicyAction.id, accessPolicyScopeData, AccessPolicyPermissionLevel.Editor);

  // Update the access policy.
  if (!request.body) {

    throw new BadRequestError("The request body must be a JSON object.");

  }

  await ServerLogEntry.create({
    message: `Updating access policy ${accessPolicy.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  const updatedAccessPolicy = await accessPolicy.update({
    inheritanceLevel: AccessPolicy.validatePropertyValue("inheritanceLevel", request.body.inheritanceLevel),
    permissionLevel: AccessPolicy.validatePropertyValue("permissionLevel", request.body.permissionLevel)
  });

  await ServerLogEntry.create({
    message: `Successfully updated access policy ${accessPolicy.id}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Success
  }, server.pool, true);

  await ActionLogEntry.create({
    actorType: principal.resourceType,
    actorUserID: principal.resourceType === "User" ? principal.id : null,
    actorAppID: principal.resourceType === "App" ? principal.id : null,
    httpRequestID: httpRequest.id,
    actionID: updateAccessPolicyAction.id,
    targetResourceType: "AccessPolicy",
    targetAccessPolicyID: accessPolicy.id
  }, server.pool);

  response.json(updatedAccessPolicy);

  await httpRequest.update({
    statusCode: 200
  });

});

export default updateAccessPolicyRouter;