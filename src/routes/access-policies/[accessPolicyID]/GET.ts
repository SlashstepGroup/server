import Item from "#resources/Item/Item.js";
import { Request, Response, Router } from "express";
import AccessPolicy, { AccessPolicyIncludedResourceClassMap } from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import { ResponseLocals } from "#utilities/types.js";
import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";
import BadRequestError from "#errors/BadRequestError.js";
import App from "#resources/App/App.js";
import Group from "#resources/Group/Group.js";
import Milestone from "#resources/Milestone/Milestone.js";
import User from "#resources/User/User.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";

const getAccessPolicyRouter = Router({mergeParams: true});
getAccessPolicyRouter.use(AuthenticationMiddleware.authenticateUser);
getAccessPolicyRouter.use(AuthenticationMiddleware.authenticateApp);
getAccessPolicyRouter.use(AuthenticationMiddleware.authenticateAppAuthorization);
getAccessPolicyRouter.use(AuthenticationMiddleware.storeAnonymousUser);
getAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server, httpRequest } = response.locals;
  const { accessPolicyID } = request.params;

  await ServerLogEntry.create({
    message: `Getting access policy ${accessPolicyID}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Pending
  }, server.pool, true);
  const accessPolicy = await AccessPolicy.getByID(accessPolicyID, server.pool);

  await ServerLogEntry.create({
    message: `Verifying principal's permissions to get access policy ${accessPolicy.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Pending
  }, server.pool, true);
  const accessPolicyScopeData = await accessPolicy.getScopeData();
  const principal = app ?? user;
  HTTPTypeGuard.assertPrincipal(principal);
  const getAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.get", server.pool);
  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, getAccessPolicyAction.id, accessPolicyScopeData);

  const includedResources: AccessPolicyIncludedResourceClassMap = {};
  const { include } = request.query;

  if (include) {

    await ServerLogEntry.create({
      message: `Getting included resources for access policy ${accessPolicy.id}...`,
      httpRequestID: httpRequest.id,
      level: ServerLogEntryLevel.Pending
    }, server.pool, true);

    const addResourceClass = (resourceType: string) => {

      switch (resourceType) {

        case "scopedAction":
          includedResources.scopedAction = Action;
          break;
        
        case "scopedApp":
          includedResources.scopedApp = App;
          break;
        
        case "scopedGroup":
          includedResources.scopedGroup = Group;
          break;
        
        case "scopedItem":
          includedResources.scopedItem = Item;
          break;
        
        case "scopedMilestone":
          includedResources.scopedMilestone = Milestone;
          break;
        
        case "scopedProject":
          includedResources.scopedProject = Project;
          break;
        
        case "scopedRole":
          includedResources.scopedRole = Role;
          break;
        
        case "scopedUser":
          includedResources.scopedUser = User;
          break;
        
        case "scopedWorkspace":
          includedResources.scopedWorkspace = Workspace;
          break;

        default:
          throw new BadRequestError(`include query must be "scopedAction", "scopedApp", "scopedGroup", "scopedItem", "scopedMilestone", "scopedProject", "scopedRole", "scopedUser", "scopedWorkspace", or excluded.`);

      }

    }

    if (typeof(include) === "string") {

      addResourceClass(include);

    } else if (include instanceof Array) {

      for (const resourceType of include) {

        if (typeof(resourceType) !== "string") {

          throw new BadRequestError("include query must be an array of strings.");

        }

        addResourceClass(resourceType);

      }

    }

  }

  await ActionLogEntry.create({
    actorType: principal.resourceType,
    actorUserID: principal.resourceType === "User" ? principal.id : null,
    actorAppID: principal.resourceType === "App" ? principal.id : null,
    httpRequestID: httpRequest.id,
    actionID: getAccessPolicyAction.id,
    targetResourceType: "AccessPolicy",
    targetAccessPolicyID: accessPolicy.id
  }, server.pool);

  await ServerLogEntry.create({
    message: `Successfully returned access policy ${accessPolicy.id}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Success
  }, server.pool, true);

  response.json(accessPolicy);

  await httpRequest.update({
    statusCode: 200
  });

});

export default getAccessPolicyRouter;