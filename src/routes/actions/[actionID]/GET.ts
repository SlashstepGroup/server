import { Request, Response, Router } from "express";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import { ResponseLocals } from "#utilities/types.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";

const getActionRouter = Router({mergeParams: true});
getActionRouter.use(AuthenticationMiddleware.authenticateUser);
getActionRouter.use(AuthenticationMiddleware.authenticateApp);
getActionRouter.use(AuthenticationMiddleware.authenticateAppAuthorization);
getActionRouter.use(AuthenticationMiddleware.storeAnonymousUser);
getActionRouter.use(async (request: Request<{ actionID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server, httpRequest } = response.locals;
  const principal = app ?? user;
  HTTPTypeGuard.assertPrincipal(principal);

  const { actionID } = request.params;
  const action = await Action.getByID(actionID, response.locals.server.pool);
  const actionScopeData = action.getScopeData();
  const getActionAction = await Action.getPreDefinedActionByName("slashstep.actions.get", response.locals.server.pool);
  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, getActionAction.id, actionScopeData);

  await ActionLogEntry.create({
    actorType: principal.resourceType,
    actorUserID: principal.resourceType === "User" ? principal.id : null,
    actorAppID: principal.resourceType === "App" ? principal.id : null,
    httpRequestID: httpRequest.id,
    actionID: getActionAction.id,
    targetResourceType: "Action",
    targetActionID: action.id
  }, server.pool);

  response.json(action);

});

export default getActionRouter;