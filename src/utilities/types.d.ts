import type { default as Action } from "#resources/Action/Action.js";
import type { default as App } from "#resources/App/App.js";
import type { default as Group } from "#resources/Group/Group.js";
import type { default as Item } from "#resources/Item/Item.js";
import type { default as Milestone } from "#resources/Milestone/Milestone.js";
import type { default as Project } from "#resources/Project/Project.js";
import type { default as Role } from "#resources/Role/Role.js";
import type { default as User } from "#resources/User/User.js";
import type { default as Workspace } from "#resources/Workspace/Workspace.js";
import type { default as Server } from "#utilities/Server/Server.js";

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