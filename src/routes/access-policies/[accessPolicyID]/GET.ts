import { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import authenticateAppAuthorization from "#utilities/hooks/authenticateAppAuthorization.js";
import storeAnonymousUser from "#utilities/hooks/storeAnonymousUser.js";
import { ResponseLocals } from "#utilities/types.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";

const getAccessPolicyRouter = Router({mergeParams: true});
getAccessPolicyRouter.use(authenticateUser);
getAccessPolicyRouter.use(authenticateApp);
getAccessPolicyRouter.use(authenticateAppAuthorization);
getAccessPolicyRouter.use(storeAnonymousUser);
getAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server } = response.locals;
  let getAccessPolicyAction: Action | null = null;
  let accessPolicy: AccessPolicy | null = null;

  try {

    getAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.get", server.pool);

    const { accessPolicyID } = request.params;
    accessPolicy = await AccessPolicy.getByID(accessPolicyID, server.pool);
    const accessPolicyScopeData = await accessPolicy.getScopeData();

    const principal = user ?? app;
    if (!principal) {

      throw new UnauthenticatedError();

    }

    await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, getAccessPolicyAction.id, accessPolicyScopeData);

    const { include } = request.query;

    const includedResources: ItemIncludedResourcesConstructorMap = {};

    // if (include) {

    //   const addResourceClass = (resourceType: string) => {

    //     switch (resourceType) {

    //       case "project":
    //         includedResources.Project = Project;
    //         break;

    //       case "project.workspace":
    //         includedResources.Workspace = Workspace;
    //         break;

    //       default:
    //         throw new HTTPError(400, "include query must be \"project\", \"project.workspace\", or excluded.");

    //     }

    //   }

    //   if (typeof(include) === "string") {

    //     addResourceClass(include);

    //   } else if (include instanceof Array) {

    //     for (const resourceType of include) {

    //       if (typeof(resourceType) !== "string") {

    //         throw new HTTPError(400, "include query must be an array of strings.");

    //       }

    //       addResourceClass(resourceType);

    //     }

    //   }

    // }

    await ActionLog.create({
      actorType: app ? "App" : "User",
      actorUserID: app ? null : user?.id,
      actorAppID: app ? app.id : null,
      actorIPAddress: request.ip,
      actionID: getAccessPolicyAction.id,
      targetResourceType: "AccessPolicy",
      targetAccessPolicyID: accessPolicy.id
    }, server.pool);

    response.json(accessPolicy);

  } catch (error) {

    if (error instanceof HTTPError) {

      if (getAccessPolicyAction) {

        await server.attemptToCreateActionLog({
          actorType: app ? "App" : "User",
          actorUserID: app ? null : user?.id,
          actorAppID: app ? app.id : null,
          actorIPAddress: request.ip,
          actionID: getAccessPolicyAction.id,
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

export default getAccessPolicyRouter;