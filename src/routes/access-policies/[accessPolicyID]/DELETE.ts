import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import authenticateAppAuthorization from "#utilities/hooks/authenticateAppAuthorization.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import { ResponseLocals } from "#utilities/types.js";
import storeAnonymousUser from "#utilities/hooks/storeAnonymousUser.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";

const deleteAccessPolicyRouter = Router({mergeParams: true});
deleteAccessPolicyRouter.use(authenticateUser);
deleteAccessPolicyRouter.use(authenticateApp);
deleteAccessPolicyRouter.use(authenticateAppAuthorization);
deleteAccessPolicyRouter.use(storeAnonymousUser);
deleteAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server } = response.locals;
  let deleteAccessPolicyAction: Action | null = null;
  let accessPolicy: AccessPolicy | null = null;

  try {
    
    deleteAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.delete", server.pool);

    const { accessPolicyID } = request.params;
    accessPolicy = await AccessPolicy.getByID(accessPolicyID, server.pool);
    const accessPolicyAction = await Action.getByID(accessPolicy.actionID, response.locals.server.pool);
    const accessPolicyScopeData = await accessPolicy.getScopeData();

    const principal = user ?? app;
    if (!principal) {

      throw new UnauthenticatedError();

    }

    await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, deleteAccessPolicyAction.id, accessPolicyScopeData);
    await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, accessPolicyAction.id, accessPolicyScopeData, AccessPolicyPermissionLevel.Editor);

    await accessPolicy.delete();

    await ActionLog.create({
      actorType: app ? "App" : "User",
      actorUserID: app ? null : user?.id,
      actorAppID: app ? app.id : null,
      actorIPAddress: request.ip,
      actionID: deleteAccessPolicyAction.id,
      targetResourceType: "AccessPolicy",
      targetAccessPolicyID: accessPolicy.id
    }, server.pool);

    response.sendStatus(204);

  } catch (error) {

    if (error instanceof HTTPError) {

      if (deleteAccessPolicyAction) {

        await server.attemptToCreateActionLog({
          actorType: app ? "App" : "User",
          actorUserID: app ? null : user?.id,
          actorAppID: app ? app.id : null,
          actorIPAddress: request.ip,
          actionID: deleteAccessPolicyAction.id,
          targetResourceType: "AccessPolicy",
          targetAccessPolicyID: accessPolicy?.id,
          errorMessage: error.message
        });

      }

      response.status(error.getStatusCode()).json(error);

    } else {

      console.error(error);

      response.status(500).json({
        message: "Something bad happened on our side. Please try again later."
      });

    }

  }

});

export default deleteAccessPolicyRouter;