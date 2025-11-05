import { Request, Response, Router } from "express";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import type { ResponseLocals } from "#utilities/types.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import BadRequestError from "#errors/BadRequestError.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";

const patchActionRouter = Router({mergeParams: true});
patchActionRouter.use(AuthenticationMiddleware.authenticateApp);
patchActionRouter.use(async (request: Request<{ actionID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { app, server, httpRequest } = response.locals;
  HTTPTypeGuard.assertPrincipal(app);

  const { actionID } = request.params;
  const action = await Action.getByID(actionID, response.locals.server.pool);
  const actionScopeData = action.getScopeData();
  const updateActionAction = await Action.getPreDefinedActionByName("slashstep.actions.update", response.locals.server.pool);

  await app.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, updateActionAction.id, actionScopeData);
  
  // Update the action.
  if (!request.body) {

    throw new BadRequestError("The request body must be a JSON object.");

  }

  const updatedAction = await action.update({
    name: Action.validatePropertyValue("name", request.body.name),
    displayName: Action.validatePropertyValue("displayName", request.body.displayName),
    description: Action.validatePropertyValue("description", request.body.description)
  });

  await ActionLogEntry.create({
    actorType: "App",
    actorAppID: app.id,
    httpRequestID: httpRequest.id,
    actionID: updateActionAction.id,
    targetResourceType: "Action",
    targetActionID: action.id
  }, server.pool);

  response.json(updatedAction);

});

export default patchActionRouter;