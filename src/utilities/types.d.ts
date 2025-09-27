export type ResourceType = "Instance" | "Workspace" | "Project" | "Iteration" | "Item" | "Group" | "Milestone";

export type Resource = {
  id: string;
  type: ResourceType;
}

export type CollectionType = "Project" | "Milestone";