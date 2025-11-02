import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import type { ResponseLocals } from "#utilities/types.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";

const patchActionRouter = Router({mergeParams: true});
patchActionRouter.use(authenticateApp);
patchActionRouter.use(async (request: Request<{ actionID: string }>, response: Response<unknown, ResponseLocals>) => {

  try {

    const { actionID } = request.params;
    const action = await Action.getByID(actionID, response.locals.server.pool);
    const actionScopeData = action.getScopeData();
    const updateActionAction = await Action.getPreDefinedActionByName("slashstep.actions.update", response.locals.server.pool);

    const { authenticatedApp } = response.locals;
    if (!authenticatedApp) {

      throw new UnauthenticatedError("This endpoint can only be accessed by apps.");

    }

    await authenticatedApp.verifyPermissions({Action, AccessPolicy}, updateActionAction.id, actionScopeData);
    
    // Update the action.
    if (!request.body) {

      throw new HTTPError(400, "The request body must be a JSON object.");

    }

    const updatedAction = await action.update({
      name: Action.validatePropertyValue("name", request.body.name),
      displayName: Action.validatePropertyValue("displayName", request.body.displayName),
      description: Action.validatePropertyValue("description", request.body.description)
    });

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