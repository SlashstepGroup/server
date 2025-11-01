import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import type { default as Server } from "#utilities/Server/Server.js";
import User from "#resources/User/User.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import authenticateAppAuthorization from "#utilities/hooks/authenticateAppAuthorization.js";

const getActionRouter = Router({mergeParams: true});
getActionRouter.use(allowUnauthenticatedRequests);
getActionRouter.use(authenticateUser);
getActionRouter.use(authenticateApp);
getActionRouter.use(authenticateAppAuthorization);
getActionRouter.use(async (request: Request<{ actionID: string }>, response: Response<unknown, { server: Server, authenticatedUser?: User }>) => {

  try {

    const { actionID } = request.params;
    const action = await Action.getByID(actionID, response.locals.server.pool);
    const actionScopeData = action.getScopeData();
    const getActionAction = await Action.getPreDefinedActionByName("slashstep.actions.get", response.locals.server.pool);

    const { authenticatedUser } = response.locals;
    if (authenticatedUser) {

      await authenticatedUser.verifyPermissions({Action, AccessPolicy}, getActionAction.id, actionScopeData);

    } else {

      await Role.verifyPermissionsForUnauthenticatedUsers({Action, AccessPolicy}, getActionAction.id, response.locals.server.pool, actionScopeData);

    }

    response.json(action);

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

export default getActionRouter;