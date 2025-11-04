import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import type { ResponseLocals } from "#utilities/types.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import BadRequestError from "#errors/BadRequestError.js";

const patchActionRouter = Router({mergeParams: true});
patchActionRouter.use(authenticateApp);
patchActionRouter.use(async (request: Request<{ actionID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { app, server } = response.locals;
  let updateActionAction: Action | null = null;

  try {
    
    if (!app) {

      throw new UnauthenticatedError("This endpoint can only be accessed by apps.");

    }

    const { actionID } = request.params;
    const action = await Action.getByID(actionID, response.locals.server.pool);
    const actionScopeData = action.getScopeData();
    updateActionAction = await Action.getPreDefinedActionByName("slashstep.actions.update", response.locals.server.pool);

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

    await ActionLog.create({
      actorType: "App",
      actorAppID: app.id,
      actorIPAddress: request.ip,
      actionID: updateActionAction.id,
      targetResourceType: "Action",
      targetActionID: action.id
    }, server.pool);

    response.json(updatedAction);

  } catch (error) {

    if (error instanceof HTTPError) {

      response.status(error.getStatusCode()).json(error);

    } else {

      console.error(error);

      response.status(500).json({
        message: "Something bad happened on our side. Please try again later."
      });

    }

  }

});

export default patchActionRouter;