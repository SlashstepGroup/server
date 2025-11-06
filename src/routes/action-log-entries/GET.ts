import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import Role from "#resources/Role/Role.js";
import HTTPInputValidator from "#utilities/HTTPInputValidator/HTTPInputValidator.js";
import { ResponseLocals } from "#utilities/types.js";
import { Response, Router } from "express";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import ActionLogEntry, { ActionLogEntryIncludedResourceClassMap } from "#resources/ActionLogEntry/ActionLogEntry.js";
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
import BadRequestError from "#errors/BadRequestError.js";

const listAccessPoliciesRouter = Router({mergeParams: true});
listAccessPoliciesRouter.use(AuthenticationMiddleware.authenticateUser);
listAccessPoliciesRouter.use(AuthenticationMiddleware.authenticateApp);
listAccessPoliciesRouter.use(AuthenticationMiddleware.authenticateAppAuthorization);
listAccessPoliciesRouter.use(AuthenticationMiddleware.storeAnonymousUser);
listAccessPoliciesRouter.use(async (request, response: Response<unknown, ResponseLocals>) => {

  const { user, app, httpRequest, server } = response.locals;
  const { query, include } = request.query;
  HTTPInputValidator.verifyString("query", query);

  const listActionLogEntryAction = await Action.getPreDefinedActionByName("slashstep.actionLogEntries.list", response.locals.server.pool);
  const principal = user ?? app;
  HTTPTypeGuard.assertPrincipal(principal);

  let includedResources: ActionLogEntryIncludedResourceClassMap = {};
  if (include) {

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

  await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, listActionLogEntryAction.id);

  const items = await ActionLogEntry.list(query ?? "", server.pool, includedResources);
  const totalItemCount = await ActionLogEntry.count(query ?? "", server.pool);
  
  await ActionLogEntry.create({
    actorType: principal.resourceType,
    actorUserID: principal.resourceType === "User" ? principal.id : null,
    actorAppID: principal.resourceType === "App" ? principal.id : null,
    httpRequestID: httpRequest.id,
    actionID: listActionLogEntryAction.id,
    targetResourceType: "Instance"
  }, server.pool);

  response.json({
    totalItemCount,
    items
  });

  await ServerLogEntry.create({
    message: `Successfully returned ${items.length} access polic${items.length === 1 ? "y" : "ies"}.`,
    httpRequestID: httpRequest.id,
    level: ServerLogEntryLevel.Success
  }, server.pool, true);

});

export default listAccessPoliciesRouter;