// import Item, { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
// import { Request, Response, Router } from "express";
// import HTTPError from "#errors/HTTPError.js";
// import authenticateUser from "#utilities/hooks/authenticateUser.js";
// import AccessPolicy, { AccessPolicyIncludedResourceClassMap } from "#resources/AccessPolicy/AccessPolicy.js";
// import Role from "#resources/Role/Role.js";
// import Action from "#resources/Action/Action.js";
// import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
// import authenticateApp from "#utilities/hooks/authenticateApp.js";
// import authenticateAppAuthorization from "#utilities/hooks/authenticateAppAuthorization.js";
// import storeAnonymousUser from "#utilities/hooks/storeAnonymousUser.js";
// import { ResponseLocals } from "#utilities/types.js";
// import UnauthenticatedError from "#errors/UnauthenticatedError.js";
// import ActionLogEntry from "#resources/ActionLogEntry/ActionLogEntry.js";
// import Project from "#resources/Project/Project.js";
// import Workspace from "#resources/Workspace/Workspace.js";
// import BadRequestError from "#errors/BadRequestError.js";
// import App from "#resources/App/App.js";
// import Group from "#resources/Group/Group.js";
// import Milestone from "#resources/Milestone/Milestone.js";
// import User from "#resources/User/User.js";

// const getAccessPolicyRouter = Router({mergeParams: true});
// getAccessPolicyRouter.use(authenticateUser);
// getAccessPolicyRouter.use(authenticateApp);
// getAccessPolicyRouter.use(authenticateAppAuthorization);
// getAccessPolicyRouter.use(storeAnonymousUser);
// getAccessPolicyRouter.use(async (request: Request<{ actionLogEntryID: string }>, response: Response<unknown, ResponseLocals>) => {

//   const { user, app, server } = response.locals;
//   let getActionLogAction: Action | null = null;

//   try {

//     const principal = app ?? user;
//     if (!principal) {

//       throw new UnauthenticatedError();

//     }

//     const { actionLogEntryID } = request.params;
//     const actionLogEntry = await ActionLogEntry.getByID(actionLogEntryID, server.pool);
//     const actionLogScopeData = await actionLogEntry.getScopeData();

//     getActionLogAction = await Action.getPreDefinedActionByName("slashstep.actionLogs.get", server.pool);
//     await principal.verifyPermissions({Action, AccessPolicy, Role, RoleMembership}, getActionLogAction.id, actionLogScopeData);

//     const includedResources: AccessPolicyIncludedResourceClassMap = {};
//     const { include } = request.query;

//     if (include) {

//       const addResourceClass = (resourceType: string) => {

//         switch (resourceType) {

//           case "scopedAction":
//             includedResources.scopedAction = Action;
//             break;
          
//           case "scopedApp":
//             includedResources.scopedApp = App;
//             break;
          
//           case "scopedGroup":
//             includedResources.scopedGroup = Group;
//             break;
          
//           case "scopedItem":
//             includedResources.scopedItem = Item;
//             break;
          
//           case "scopedMilestone":
//             includedResources.scopedMilestone = Milestone;
//             break;
          
//           case "scopedProject":
//             includedResources.scopedProject = Project;
//             break;
          
//           case "scopedRole":
//             includedResources.scopedRole = Role;
//             break;
          
//           case "scopedUser":
//             includedResources.scopedUser = User;
//             break;
          
//           case "scopedWorkspace":
//             includedResources.scopedWorkspace = Workspace;
//             break;

//           default:
//             throw new BadRequestError(`include query must be "scopedAction", "scopedApp", "scopedGroup", "scopedItem", "scopedMilestone", "scopedProject", "scopedRole", "scopedUser", "scopedWorkspace", or excluded.`);

//         }

//       }

//       if (typeof(include) === "string") {

//         addResourceClass(include);

//       } else if (include instanceof Array) {

//         for (const resourceType of include) {

//           if (typeof(resourceType) !== "string") {

//             throw new BadRequestError("include query must be an array of strings.");

//           }

//           addResourceClass(resourceType);

//         }

//       }

//     }

//     await ActionLogEntry.create({
//       actorType: app ? "App" : "User",
//       actorUserID: app ? null : user?.id,
//       actorAppID: app ? app.id : null,
//       actorIPAddress: request.ip,
//       actionID: getActionLogAction.id,
//       targetResourceType: "ActionLogEntry",
//       targetActionLogEntryID: actionLogEntry.id
//     }, server.pool);

//     response.json(actionLogEntry);

//   } catch (error) {

//     if (error instanceof HTTPError) {

//       response.status(error.getStatusCode()).json(error);

//     } else {

//       console.error(error);

//       response.status(500).json({
//         message: "Something bad happened on our side. Please try again later."
//       });

//     }

//   }

// });

// export default getAccessPolicyRouter;