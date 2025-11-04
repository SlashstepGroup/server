import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import authenticateAppAuthorization from "#utilities/hooks/authenticateAppAuthorization.js";
import { ResponseLocals } from "#utilities/types.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import storeAnonymousUser from "#utilities/hooks/storeAnonymousUser.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";

const updateAccessPolicyRouter = Router({mergeParams: true});
updateAccessPolicyRouter.use(authenticateUser);
updateAccessPolicyRouter.use(authenticateApp);
updateAccessPolicyRouter.use(authenticateAppAuthorization);
updateAccessPolicyRouter.use(storeAnonymousUser);
updateAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }, unknown, {inheritanceLevel: unknown, permissionLevel: unknown} | undefined>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server } = response.locals;
  let updateAccessPolicyAction: Action | null = null;
  let accessPolicy: AccessPolicy | null = null;

  try {

    // Make sure the access policy exists.
    const { accessPolicyID } = request.params;
    accessPolicy = await AccessPolicy.getByID(accessPolicyID, server.pool);
    const accessPolicyAction = await Action.getByID(accessPolicy.actionID, server.pool);

    // Make sure the user has permission to view the access policy.
    const accessPolicyScopeData = await accessPolicy.getScopeData();
    updateAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.update", server.pool);
    const principal = user ?? app;
    if (!principal) {

      throw new UnauthenticatedError();

    }

    await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, updateAccessPolicyAction.id, accessPolicyScopeData);
    await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, accessPolicyAction.id, accessPolicyScopeData, AccessPolicyPermissionLevel.Editor);

    // Update the access policy.
    if (!request.body) {

      throw new HTTPError(400, "The request body must be a JSON object.");

    }

    const updatedAccessPolicy = await accessPolicy.update({
      inheritanceLevel: AccessPolicy.validatePropertyValue("inheritanceLevel", request.body.inheritanceLevel),
      permissionLevel: AccessPolicy.validatePropertyValue("permissionLevel", request.body.permissionLevel)
    });

    await ActionLog.create({
      actorType: app ? "App" : "User",
      actorUserID: app ? null : user?.id,
      actorAppID: app ? app.id : null,
      actorIPAddress: request.ip,
      actionID: updateAccessPolicyAction.id,
      targetResourceType: "AccessPolicy",
      targetAccessPolicyID: accessPolicy.id
    }, server.pool);

    response.json(updatedAccessPolicy);

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

export default updateAccessPolicyRouter;