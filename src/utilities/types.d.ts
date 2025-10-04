import User from "#resources/User/User.js";
import Server from "./Server/Server.ts";

export type ResourceType = "Instance" | "Workspace" | "Project" | "Iteration" | "Item" | "Group" | "Milestone";

export type CollectionType = "Project" | "Milestone";

export type ResponseLocals = {
  server: Server;
  authenticatedUser?: User;
  areUnauthenticatedRequestsAllowed?: boolean;
}