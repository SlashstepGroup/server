import { Request, Response, Router } from "express";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import type { ResponseLocals } from "#utilities/types.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";

const deleteActionRouter = Router({mergeParams: true});
deleteActionRouter.use(AuthenticationMiddleware.authenticateApp);
deleteActionRouter.use(async (request: Request<{ actionID: string }>, response: Response<unknown, ResponseLocals>) => {

  // Verify the principal is an app.
  const { app, server, httpRequest } = response.locals;
  await ServerLogEntry.create({
    message: "Verifying principal is an app...",
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Pending
  }, server.pool, true);
  HTTPTypeGuard.assertPrincipal(app);
  
  // Get the action.
  const { actionID } = request.params;
  await ServerLogEntry.create({
    message: `Getting action ${actionID}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Pending
  }, server.pool, true);
  const action = await Action.getByID(actionID, response.locals.server.pool);

  // Make sure the user has permission to delete the action.
  const actionScopeData = action.getScopeData();
  const deleteActionAction = await Action.getPreDefinedActionByName("slashstep.actions.delete", response.locals.server.pool);

  await ServerLogEntry.create({
    message: `Verifying principal's permissions to delete action ${action.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Pending
  }, server.pool, true);
  await app.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, deleteActionAction.id, actionScopeData);

  // Delete the action.
  await ServerLogEntry.create({
    message: `Deleting action ${action.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Pending
  }, server.pool, true);
  await action.delete();

  await ServerLogEntry.create({
    message: `Successfully deleted action ${action.id}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Success
  }, server.pool, true);

  await ActionLogEntry.create({
    actorType: "App",
    actorAppID: app.id,
    httpRequestID: httpRequest.id,
    actionID: deleteActionAction.id,
    targetResourceType: "Action",
    targetActionID: action.id
  }, server.pool);

  response.sendStatus(204);

});

export default deleteActionRouter;