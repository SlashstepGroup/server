import HTTPError from "#errors/HTTPError.js";
import SlashstepQLInvalidKeyError from "#errors/SlashstepQLInvalidKeyError.js";
import SlashstepQLInvalidQueryError from "#errors/SlashstepQLInvalidQueryError.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import Role from "#resources/Role/Role.js";
import authenticateApp from "#utilities/hooks/authenticateApp.js";
import authenticateAppAuthorization from "#utilities/hooks/authenticateAppAuthorization.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import storeAnonymousUser from "#utilities/hooks/storeAnonymousUser.js";
import HTTPInputValidator from "#utilities/HTTPInputValidator/HTTPInputValidator.js";
import { ResourceClassMap, ResponseLocals } from "#utilities/types.js";
import { Response, Router } from "express";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";

const listAccessPoliciesRouter = Router({mergeParams: true});
listAccessPoliciesRouter.use(authenticateUser);
listAccessPoliciesRouter.use(authenticateApp);
listAccessPoliciesRouter.use(authenticateAppAuthorization);
listAccessPoliciesRouter.use(storeAnonymousUser);
listAccessPoliciesRouter.use(async (request, response: Response<unknown, ResponseLocals>) => {

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

    const listActionsAction = await Action.getPreDefinedActionByName("slashstep.actions.list", response.locals.server.pool);
    const { user, app, server } = response.locals;
    const principal = app ?? user;
    if (!principal) {
      
      throw new UnauthenticatedError();

    }

    await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, listActionsAction.id);

    const items = await Action.list(query ?? "", server.pool);
    const totalItemCount = await Action.count(query ?? "", server.pool);
    
    await ActionLog.create({
      actorType: app ? "App" : "User",
      actorUserID: app ? null : user?.id,
      actorAppID: app ? app.id : null,
      actorIPAddress: request.ip,
      actionID: listActionsAction.id,
      targetResourceType: "Instance"
    }, server.pool);

    response.json({
      totalItemCount,
      items
    });

  } catch (error) {

    if (error instanceof SlashstepQLInvalidKeyError || error instanceof SlashstepQLInvalidQueryError) {

      response.status(400).json(error);

    } else if (error instanceof HTTPError) {

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