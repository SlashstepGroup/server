import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import Role from "#resources/Role/Role.js";
import HTTPInputValidator from "#utilities/HTTPInputValidator/HTTPInputValidator.js";
import { ResourceClassMap, ResponseLocals } from "#utilities/types.js";
import { Response, Router } from "express";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";

const listAccessPoliciesRouter = Router({mergeParams: true});
listAccessPoliciesRouter.use(AuthenticationMiddleware.authenticateUser);
listAccessPoliciesRouter.use(AuthenticationMiddleware.authenticateApp);
listAccessPoliciesRouter.use(AuthenticationMiddleware.authenticateAppAuthorization);
listAccessPoliciesRouter.use(AuthenticationMiddleware.storeAnonymousUser);
listAccessPoliciesRouter.use(async (request, response: Response<unknown, ResponseLocals>) => {
  
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
  const { user, app, server, httpRequest } = response.locals;
  const principal = app ?? user;
  HTTPTypeGuard.assertPrincipal(principal);

  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, listActionsAction.id);

  const items = await Action.list(query ?? "", server.pool);
  const totalItemCount = await Action.count(query ?? "", server.pool);
  
  await ActionLogEntry.create({
    actorType: principal.resourceType,
    actorUserID: principal.resourceType === "User" ? principal.id : null,
    actorAppID: principal.resourceType === "App" ? principal.id : null,
    httpRequestID: httpRequest.id,
    actionID: listActionsAction.id,
    targetResourceType: "Instance"
  }, server.pool);

  response.json({
    totalItemCount,
    items
  });

});

export default listAccessPoliciesRouter;