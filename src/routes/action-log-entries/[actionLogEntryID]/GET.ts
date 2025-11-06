import { Request, Response, Router } from "express";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import { ResponseLocals } from "#utilities/types.js";
import ActionLogEntry, { ActionLogEntryIncludedResourceClassMap } from "#resources/ActionLogEntry/ActionLogEntry.js";
import BadRequestError from "#errors/BadRequestError.js";
import AuthenticationMiddleware from "#utilities/middleware/AuthenticationMiddleware.js";
import HTTPTypeGuard from "#utilities/HTTPTypeGuard.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";
import App from "#resources/App/App.js";
import AppAuthorization from "#resources/AppAuthorization/AppAuthorization.js";
import AppAuthorizationCredential from "#resources/AppAuthorizationCredential/AppAuthorizationCredential.js";
import AppCredential from "#resources/AppCredential/AppCredential.js";
import Field from "#resources/Field/Field.js";
import Group from "#resources/Group/Group.js";
import Item from "#resources/Item/Item.js";
import ItemConnection from "#resources/ItemConnection/ItemConnection.js";
import ItemConnectionType from "#resources/ItemConnectionType/ItemConnectionType.js";
import Milestone from "#resources/Milestone/Milestone.js";
import Project from "#resources/Project/Project.js";
import Session from "#resources/Session/Session.js";
import User from "#resources/User/User.js";

const getActionLogEntryRouter = Router({mergeParams: true});
getActionLogEntryRouter.use(AuthenticationMiddleware.authenticateUser);
getActionLogEntryRouter.use(AuthenticationMiddleware.authenticateApp);
getActionLogEntryRouter.use(AuthenticationMiddleware.authenticateAppAuthorization);
getActionLogEntryRouter.use(AuthenticationMiddleware.storeAnonymousUser);
getActionLogEntryRouter.use(async (request: Request<{ actionLogEntryID: string }>, response: Response<unknown, ResponseLocals>) => {

  const { user, app, server, httpRequest } = response.locals;
  const { actionLogEntryID } = request.params;

  await ServerLogEntry.create({
    message: `Getting action log entry ${actionLogEntryID}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  const actionLogEntry = await ActionLogEntry.getByID(actionLogEntryID, server.pool);

  await ServerLogEntry.create({
    message: `Verifying principal's permissions to get action log entry ${actionLogEntry.id}...`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Trace
  }, server.pool, true);

  const actionLogEntryScopeData = actionLogEntry.getScopeData();
  const principal = app ?? user;
  HTTPTypeGuard.assertPrincipal(principal);
  const getActionLogEntryAction = await Action.getPreDefinedActionByName("slashstep.actionLogEntries.get", server.pool);
  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, getActionLogEntryAction.id, actionLogEntryScopeData);

  let includedResources: ActionLogEntryIncludedResourceClassMap = {};
  const { include } = request.query;

  if (include) {

    await ServerLogEntry.create({
      message: `Getting included resources for action log entry ${actionLogEntry.id}...`,
      httpRequestID: httpRequest.id,
      level: ServerLogEntryLevel.Trace
    }, server.pool, true);

    const resourceClassMap: ActionLogEntryIncludedResourceClassMap = {
      targetAccessPolicy: AccessPolicy,
      targetAction: Action,
      targetActionLogEntry: ActionLogEntry,
      targetApp: App,
      targetAppAuthorization: AppAuthorization,
      targetAppAuthorizationCredential: AppAuthorizationCredential,
      targetAppCredential: AppCredential,
      targetField: Field,
      targetGroup: Group,
      targetItem: Item,
      targetItemConnection: ItemConnection,
      targetItemConnectionType: ItemConnectionType,
      targetMilestone: Milestone,
      targetProject: Project,
      targetRole: Role,
      targetSession: Session,
      targetUser: User,
    };
    const allowedResourceTypes = Object.keys(resourceClassMap);
    const assertResourceType: (resourceType: string) => asserts resourceType is keyof ActionLogEntryIncludedResourceClassMap = (resourceType) => {

      if (!allowedResourceTypes.includes(resourceType)) {

        throw new BadRequestError(`"include" query parameter must be excluded or only include the following: ${allowedResourceTypes.join(", ")}`);

      }

    };

    const addResourceClass = (resourceType: keyof ActionLogEntryIncludedResourceClassMap) => {
      
      const resourceClass = resourceClassMap[resourceType];

      // For some reason, TypeScript doesn't like doing this:
      // includedResources[resourceType] = resourceClass;
      // Once this gets fixed, we can remove the spread operator.
      includedResources = {
        ...includedResources,
        [resourceType]: resourceClass
      }

    }

    if (typeof(include) === "string") {

      assertResourceType(include);
      addResourceClass(include);

    } else if (include instanceof Array) {

      for (let i = 0; i < include.length; i++) {

        const resourceType = include[i];
        if (typeof(resourceType) !== "string") {

          throw new BadRequestError(`include query must be an array of strings. Found ${typeof(resourceType)} at index ${i} in the array.`);

        }

        assertResourceType(resourceType);
        addResourceClass(resourceType);

      }

    }

  }

  response.json(actionLogEntry);

  await ActionLogEntry.create({
    actorType: principal.resourceType,
    actorUserID: principal.resourceType === "User" ? principal.id : null,
    actorAppID: principal.resourceType === "App" ? principal.id : null,
    httpRequestID: httpRequest.id,
    actionID: getActionLogEntryAction.id,
    targetResourceType: "ActionLogEntry",
    targetActionLogEntryID: actionLogEntry.id
  }, server.pool);

  await ServerLogEntry.create({
    message: `Successfully returned action log entry ${actionLogEntry.id}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Success
  }, server.pool, true);

  await httpRequest.update({
    statusCode: 200
  });

});

export default getActionLogEntryRouter;