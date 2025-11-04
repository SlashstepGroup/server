import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import authenticateAppAuthorization from "#utilities/hooks/authenticateAppAuthorization.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import { ResponseLocals } from "#utilities/types.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import storeAnonymousUser from "#utilities/hooks/storeAnonymousUser.js";

const getActionRouter = Router({mergeParams: true});
getActionRouter.use(authenticateUser);
getActionRouter.use(authenticateApp);
getActionRouter.use(authenticateAppAuthorization);
getActionRouter.use(storeAnonymousUser);
getActionRouter.use(async (request: Request<{ actionID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server } = response.locals;

  try {

    const principal = user ?? app;
    if (!principal) {

      throw new UnauthenticatedError();

    }

    const { actionID } = request.params;
    const action = await Action.getByID(actionID, response.locals.server.pool);
    const actionScopeData = action.getScopeData();
    const getActionAction = await Action.getPreDefinedActionByName("slashstep.actions.get", response.locals.server.pool);
    await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, getActionAction.id, actionScopeData);

    await ActionLog.create({
      actorType: app ? "App" : "User",
      actorUserID: app ? null : user?.id,
      actorAppID: app ? app.id : null,
      actorIPAddress: request.ip,
      actionID: getActionAction.id,
      targetResourceType: "Action",
      targetActionID: action.id
    }, server.pool);

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