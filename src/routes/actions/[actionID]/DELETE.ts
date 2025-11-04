import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import type { ResponseLocals } from "#utilities/types.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";

const deleteActionRouter = Router({mergeParams: true});
deleteActionRouter.use(authenticateApp);
deleteActionRouter.use(async (request: Request<{ actionID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { app, server } = response.locals;
  let deleteActionAction: Action | null = null;
  let action: Action | null = null;

  try {

    if (!app) {

      throw new UnauthenticatedError();

    }
    
    const { actionID } = request.params;
    action = await Action.getByID(actionID, response.locals.server.pool);
    const actionScopeData = action.getScopeData();
    deleteActionAction = await Action.getPreDefinedActionByName("slashstep.actions.delete", response.locals.server.pool);

    await app.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, deleteActionAction.id, actionScopeData);

    await action.delete();
    
    await ActionLog.create({
      actorType: "App",
      actorAppID: app.id,
      actorIPAddress: request.ip,
      actionID: deleteActionAction.id,
      targetResourceType: "Action",
      targetActionID: action.id
    }, server.pool);

    response.sendStatus(204);

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

export default deleteActionRouter;