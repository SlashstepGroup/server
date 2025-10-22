import Action from "#resources/Action/Action.js";
import App from "#resources/App/App.js";
import Group from "#resources/Group/Group.js";
import Item from "#resources/Item/Item.js";
import Milestone from "#resources/Milestone/Milestone.js";
import Project from "#resources/Project/Project.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Workspace from "#resources/Workspace/Workspace.js";
import Server from "./Server/Server.ts";

export type ResourceType = "Instance" | "Workspace" | "Project" | "Iteration" | "Item" | "Group" | "Milestone";

export type CollectionType = "Project" | "Milestone";

export type ResponseLocals = {
  server: Server;
  authenticatedUser?: User;
  areUnauthenticatedRequestsAllowed?: boolean;
}

export type ResourceClassMap = Record<string, (
  typeof Action
  | typeof App
  | typeof Group
  | typeof Item
  | typeof Milestone
  | typeof Project
  | typeof Role
  | typeof User
  | typeof Workspace
)>;