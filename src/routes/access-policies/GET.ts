import HTTPError from "#errors/HTTPError.js";
import SlashstepQLInvalidKeyError from "#errors/SlashstepQLInvalidKeyError.js";
import SlashstepQLInvalidQueryError from "#errors/SlashstepQLInvalidQueryError.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import Role from "#resources/Role/Role.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import authenticateAppAuthorization from "#utilities/hooks/authenticateAppAuthorization.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import storeAnonymousUser from "#utilities/hooks/storeAnonymousUser.js";
import HTTPInputValidator from "#utilities/HTTPInputValidator/HTTPInputValidator.js";
import { ResourceClassMap, ResponseLocals } from "#utilities/types.js";
import { Response, Router } from "express";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";

const listAccessPoliciesRouter = Router({mergeParams: true});
listAccessPoliciesRouter.use(authenticateUser);
listAccessPoliciesRouter.use(authenticateApp);
listAccessPoliciesRouter.use(authenticateAppAuthorization);
listAccessPoliciesRouter.use(storeAnonymousUser);
listAccessPoliciesRouter.use(async (request, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server } = response.locals;
  let listAccessPolicyAction: Action | null = null;

  try {
  
    const { query, include } = request.query;
    HTTPInputValidator.verifyString("query", query);

    const includedResources: ResourceClassMap = {};

    // if (include) {

    //   const addResourceClass = (resourceType: string) => {

    //     const resourceClassMap: ResourceClassMap = {
    //       action: Action,
    //       "action.app": App,
    //       "action.app.workspace": Workspace,
    //       app: App,
    //       "app.workspace": Workspace,
    //       group: Group,
    //       "group.workspace": Workspace,
    //       item: Item,
    //       "item.project": Project,
    //       "item.project.workspace": Workspace,
    //       milestone: Milestone,
    //       "milestone.project": Project,
    //       "milestone.project.workspace": Workspace,
    //       "milestone.workspace": Workspace,
    //       project: Project,
    //       "project.workspace": Workspace,
    //       role: Role,
    //       "role.workspace": Workspace,
    //       "role.project": Project,
    //       "role.project.workspace": Workspace,
    //       user: User,
    //       workspace: Workspace,
    //     };

    //     const resourceClass = resourceClassMap[resourceType];
    //     if (!resourceClass) {

    //       throw new HTTPError(400, "include query must be \"project\", \"project.workspace\", or excluded.");

    //     }

    //     includedResources[resourceType] = resourceClass;

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

    listAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.list", response.locals.server.pool);
    const principal = user ?? app;
    if (!principal) {
 
      throw new UnauthenticatedError();

    }

    await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, listAccessPolicyAction.id);

    const { server } = response.locals;
    const items = await AccessPolicy.list(query ?? "", server.pool, includedResources);
    const totalItemCount = await AccessPolicy.count(query ?? "", server.pool);
    
    response.json({
      totalItemCount,
      items
    });

    await ActionLog.create({
      actorType: app ? "App" : "User",
      actorUserID: app ? null : user?.id,
      actorAppID: app ? app.id : null,
      actorIPAddress: request.ip,
      actionID: listAccessPolicyAction.id,
      targetResourceType: "Instance"
    }, server.pool);

  } catch (error) {

    if (error instanceof HTTPError) {

      if (listAccessPolicyAction) {

        await server.attemptToCreateActionLog({
          actorType: app ? "App" : "User",
          actorUserID: app ? null : user?.id,
          actorAppID: app ? app.id : null,
          actorIPAddress: request.ip,
          actionID: listAccessPolicyAction.id,
          targetResourceType: "Instance",
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

export default listAccessPoliciesRouter;