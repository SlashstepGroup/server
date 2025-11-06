import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";
import BadRequestError from "#errors/BadRequestError.js";
import type { default as Action, BaseActionProperties, InitialWritableActionProperties } from "#resources/Action/Action.js";
import type { default as App, AppProperties } from "#resources/App/App.js";
import type { BaseGroupProperties, default as Group } from "#resources/Group/Group.js";
import type { default as Item } from "#resources/Item/Item.js";
import type { BaseMilestoneProperties, default as Milestone } from "#resources/Milestone/Milestone.js";
import type { default as Project, ProjectProperties } from "#resources/Project/Project.js";
import type { default as Role, InitialWritableRoleProperties, BaseRoleProperties } from "#resources/Role/Role.js";
import type { default as User, UserProperties } from "#resources/User/User.js";
import type { default as Workspace, WorkspaceProperties } from "#resources/Workspace/Workspace.js";
import type { default as Resource } from "src/interfaces/Resource.js";
import type { StringUnion } from "#utilities/types.js";

export type AccessPolicyIncludedResourceClassMap = {
  principalUser?: typeof User;
  principalGroup?: typeof Group;
  principalRole?: typeof Role;
  principalApp?: typeof App;
  scopedAction?: typeof Action;
  scopedApp?: typeof App;
  scopedGroup?: typeof Group;
  scopedItem?: typeof Item;
  scopedMilestone?: typeof Milestone;
  scopedProject?: typeof Project;
  scopedRole?: typeof Role;
  scopedUser?: typeof User;
  scopedWorkspace?: typeof Workspace;
  action?: typeof Action;
}

export type AccessPolicyIncludedResourceMap = {
  [key in keyof AccessPolicyIncludedResourceClassMap]?: InstanceType<NonNullable<AccessPolicyIncludedResourceClassMap[key]>>;
}

export enum AccessPolicyPermissionLevel {

  /** Principal cannot perform this action. */
  None = "None",

  /** Principal can perform this action. */
  User = "User",

  /** Principal can perform this action, along with managing the permission levels of other principals. */
  Editor = "Editor",

  /** Principal can perform this action, along with managing the permission levels of other principals in addition to overriding the inheritance requirements of this access policy on child resources. */
  Admin = "Admin"

}

export enum AccessPolicyInheritanceLevel {

  /** Child resources will not inherit this access policy. */
  Disabled = "Disabled",

  /** Child resources will inherit this access policy by default. */
  Enabled = "Enabled",

  /** Child resources will inherit this access policy and are required to have the selected permission level at minimum. */
  Required = "Required"

}

export enum AccessPolicyPrincipalType {
  Group = "Group",
  User = "User",
  Role = "Role",
  App = "App"
}

export type BaseAccessPolicyProperties = {
  id: string;
  principalType: StringUnion<AccessPolicyPrincipalType>;
  principalUserID?: string | null;
  principalGroupID?: string | null;
  principalRoleID?: string | null;
  principalAppID?: string | null;
  scopedResourceType: StringUnion<AccessPolicyScopedResourceType>;
  scopedActionID?: string | null;
  scopedAppID?: string | null;
  scopedGroupID?: string | null;
  scopedItemID?: string | null;
  scopedMilestoneID?: string | null;
  scopedProjectID?: string | null;
  scopedRoleID?: string | null;
  scopedUserID?: string | null;
  scopedWorkspaceID?: string | null;
  actionID: string;
  permissionLevel: AccessPolicyPermissionLevel | `${AccessPolicyPermissionLevel}`;
  inheritanceLevel: AccessPolicyInheritanceLevel | `${AccessPolicyInheritanceLevel}`;
}

export type AccessPolicyScopeData = {
  scopedResourceType: AccessPolicyScopedResourceType | `${AccessPolicyScopedResourceType}`;
  actionID?: string | null;
  actionLogEntryID?: string | null;
  appID?: string | null;
  groupID?: string | null;
  itemID?: string | null;
  milestoneID?: string | null;
  projectID?: string | null;
  roleID?: string | null;
  userID?: string | null;
  workspaceID?: string | null;
};

export type ExtendedAccessPolicyProperties = BaseAccessPolicyProperties & {
  principalUser?: User;
  principalGroup?: Group;
  principalRole?: Role;
  principalApp?: App;
  scopedAction?: Action;
  scopedApp?: App;
  scopedGroup?: Group;
  scopedItem?: Item;
  scopedMilestone?: Milestone;
  scopedProject?: Project;
  scopedRole?: Role;
  scopedUser?: User;
  scopedWorkspace?: Workspace;
  action?: Action;
}

export type EditableAccessPolicyProperties = Omit<BaseAccessPolicyProperties, "id" | "principalType" | "principalUserID" | "principalGroupID" | "principalRoleID" | "scopedResourceType" | "scopedActionID" | "scopedAppID" | "scopedGroupID" | "scopedItemID" | "scopedMilestoneID" | "scopedProjectID" | "scopedRoleID" | "scopedUserID" | "scopedWorkspaceID" | "actionID">;

export enum AccessPolicyScopedResourceType {
  App = "App",
  Action = "Action",
  ActionLogEntry = "ActionLogEntry",
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  Item = "Item",
  Group = "Group",
  Milestone = "Milestone",
  Role = "Role",
  User = "User"
}

export type AccessPolicyTableQueryResult = {
  id: string;
  principal_type: AccessPolicyPrincipalType;
  scoped_resource_type: AccessPolicyScopedResourceType;
  action_id: string;
  permission_level: AccessPolicyPermissionLevel;
  inheritance_level: AccessPolicyInheritanceLevel;
}

export type AccessPolicyQueryResult = {
  id: string;
  principal_type: StringUnion<AccessPolicyPrincipalType>;
  principal_app: AppProperties | null;
  principal_app_id: string | null;
  principal_user_id: string | null;
  principal_user: UserProperties | null;
  principal_group: BaseGroupProperties | null;
  principal_group_id: string | null;
  principal_role_id: string;
  principal_role: BaseRoleProperties | null;
  scoped_resource_type: StringUnion<AccessPolicyScopedResourceType>;
  scoped_action_id: string | null;
  scoped_action: BaseActionProperties | null;
  scoped_app_id: string | null;
  scoped_app: AppProperties | null;
  scoped_group_id: string | null;
  scoped_group: BaseGroupProperties | null;
  scoped_item_id: string | null;
  scoped_item: Item | null;
  scoped_milestone_id: string | null;
  scoped_milestone: BaseMilestoneProperties | null;
  scoped_project_id: string | null;
  scoped_project: ProjectProperties | null;
  scoped_role_id: string | null;
  scoped_role: BaseRoleProperties | null;
  scoped_user_id: string | null;
  scoped_user: UserProperties | null;
  scoped_workspace_id: string | null;
  scoped_workspace: WorkspaceProperties | null;
  action_id: string;
  action: BaseActionProperties;
  permission_level: StringUnion<AccessPolicyPermissionLevel>;
  inheritance_level: StringUnion<AccessPolicyInheritanceLevel>;
}

export type AccessPolicyPrincipalData = {
  principalType: AccessPolicyPrincipalType.User | `${AccessPolicyPrincipalType.User}`;
  principalUserID: string;
} | {
  principalType: AccessPolicyPrincipalType.Group | `${AccessPolicyPrincipalType.Group}`;
  principalGroupID: string;
} | {
  principalType: AccessPolicyPrincipalType.Role | `${AccessPolicyPrincipalType.Role}`;
  principalRoleID: string;
} | {
  principalType: AccessPolicyPrincipalType.App | `${AccessPolicyPrincipalType.App}`;
  principalAppID: string;
}

export type ScopeResourceClassMap = {
  Action?: typeof Action;
  App?: typeof App;
  Group?: typeof Group;
  Item?: typeof Item;
  Milestone?: typeof Milestone;
  Project?: typeof Project;
  Role?: typeof Role;
  User?: typeof User;
  Workspace?: typeof Workspace;
}

/**
 * An AccessPolicy defines the permissions a principal has on a resource.
 */
export default class AccessPolicy implements Resource<AccessPolicyScopeData> {

  static readonly name = "AccessPolicy";

  readonly resourceType = "AccessPolicy";

  static readonly allowedQueryFields = {
    id: "id", 
    actionID: "action_id",
    principalType: "principal_type",
    principalUserID: "principal_user_id",
    principalGroupID: "principal_group_id",
    principalRoleID: "principal_role_id",
    principalAppID: "principal_app_id",
    scopedResourceType: "scoped_resource_type",
    scopedActionID: "scoped_action_id",
    scopedAppID: "scoped_app_id",
    scopedGroupID: "scoped_group_id",
    scopedItemID: "scoped_item_id",
    scopedMilestoneID: "scoped_milestone_id",
    scopedProjectID: "scoped_project_id",
    scopedRoleID: "scoped_role_id",
    scopedUserID: "scoped_user_id",
    scopedWorkspaceID: "scoped_workspace_id",
    permissionLevel: "permission_level", 
    inheritanceLevel: "inheritance_level"
  }

  /** The access policy's ID. */
  readonly id: BaseAccessPolicyProperties["id"];

  readonly actionID: BaseAccessPolicyProperties["actionID"];

  /** The type of principal this access policy applies to, such as "User", "Group", etc. */
  readonly principalType: BaseAccessPolicyProperties["principalType"];

  /** The user principal this access policy applies to. */
  readonly principalUser: ExtendedAccessPolicyProperties["principalUser"];

  /** The ID of the user principal this access policy applies to. */
  readonly principalUserID: BaseAccessPolicyProperties["principalUserID"];

  /** The group principal this access policy applies to. */
  readonly principalGroup: ExtendedAccessPolicyProperties["principalGroup"];

  /** The ID of the group principal this access policy applies to. */
  readonly principalGroupID: BaseAccessPolicyProperties["principalGroupID"];

  /** The role principal this access policy applies to. */
  readonly principalRole: ExtendedAccessPolicyProperties["principalRole"];

  /** The ID of the role principal this access policy applies to. */
  readonly principalRoleID: BaseAccessPolicyProperties["principalRoleID"];

  /** The app principal this access policy applies to. */
  readonly principalApp: ExtendedAccessPolicyProperties["principalApp"];

  /** The ID of the app principal this access policy applies to. */
  readonly principalAppID: BaseAccessPolicyProperties["principalAppID"];

  /** The type of resource this access policy applies to, such as "Workspace", "Project", etc. */
  readonly scopedResourceType: BaseAccessPolicyProperties["scopedResourceType"];

  /** The workspace this access policy applies to. */
  readonly scopedWorkspace: ExtendedAccessPolicyProperties["scopedWorkspace"];

  /** The ID of the workspace this access policy applies to. */
  readonly scopedWorkspaceID: BaseAccessPolicyProperties["scopedWorkspaceID"];

  /** The project this access policy applies to. */
  readonly scopedProject: ExtendedAccessPolicyProperties["scopedProject"];

  /** The ID of the project this access policy applies to. */
  readonly scopedProjectID: BaseAccessPolicyProperties["scopedProjectID"];

  /** The app this access policy applies to. */
  readonly scopedApp: ExtendedAccessPolicyProperties["scopedApp"];

  /** The ID of the app this access policy applies to. */
  readonly scopedAppID: BaseAccessPolicyProperties["scopedAppID"];

  /** The item this access policy applies to. */
  readonly scopedItem?: ExtendedAccessPolicyProperties["scopedItem"];

  /** The ID of the item this access policy applies to. */
  readonly scopedItemID: BaseAccessPolicyProperties["scopedItemID"];

  /** The action this access policy applies to. */
  readonly scopedAction: ExtendedAccessPolicyProperties["scopedAction"];

  /** The ID of the action this access policy applies to, such as "slashstep.items.create". */
  readonly scopedActionID: BaseAccessPolicyProperties["scopedActionID"];

  /** The role this access policy applies to. */
  readonly scopedRole: ExtendedAccessPolicyProperties["scopedRole"];

  /** The ID of the role this access policy applies to. */
  readonly scopedRoleID: BaseAccessPolicyProperties["scopedRoleID"];

  /** The group this access policy applies to. */
  readonly scopedGroup: ExtendedAccessPolicyProperties["scopedGroup"];

  /** The ID of the group this access policy applies to. */
  readonly scopedGroupID: BaseAccessPolicyProperties["scopedGroupID"];

  /** The user this access policy applies to. */
  readonly scopedUser: ExtendedAccessPolicyProperties["scopedUser"];

  /** The ID of the user this access policy applies to. */
  readonly scopedUserID: BaseAccessPolicyProperties["scopedUserID"];

  /** The milestone this access policy applies to. */
  readonly scopedMilestone: ExtendedAccessPolicyProperties["scopedMilestone"];

  /** The ID of the milestone this access policy applies to. */
  readonly scopedMilestoneID: BaseAccessPolicyProperties["scopedMilestoneID"];

  /** The level of permission granted by this access policy. */
  readonly permissionLevel: BaseAccessPolicyProperties["permissionLevel"];

  /** The level of inheritance granted by this access policy. */
  readonly inheritanceLevel: BaseAccessPolicyProperties["inheritanceLevel"];

  /** The action this access policy applies to. */
  readonly action: ExtendedAccessPolicyProperties["action"];

  readonly #pool: Pool;

  constructor(data: ExtendedAccessPolicyProperties, pool: Pool) {

    this.id = data.id;
    this.principalType = data.principalType;
    this.principalUser = data.principalUser;
    this.principalUserID = data.principalUserID;
    this.principalGroup = data.principalGroup;
    this.principalGroupID = data.principalGroupID;
    this.principalRole = data.principalRole;
    this.principalRoleID = data.principalRoleID;
    this.principalApp = data.principalApp;
    this.principalAppID = data.principalAppID;
    this.scopedResourceType = data.scopedResourceType;
    this.scopedWorkspace = data.scopedWorkspace;
    this.scopedWorkspaceID = data.scopedWorkspaceID;
    this.scopedProject = data.scopedProject;
    this.scopedProjectID = data.scopedProjectID;
    this.scopedItem = data.scopedItem;
    this.scopedItemID = data.scopedItemID;
    this.scopedAction = data.scopedAction;
    this.scopedActionID = data.scopedActionID;
    this.scopedRole = data.scopedRole;
    this.scopedRoleID = data.scopedRoleID;
    this.scopedGroup = data.scopedGroup;
    this.scopedGroupID = data.scopedGroupID;
    this.scopedUser = data.scopedUser;
    this.scopedUserID = data.scopedUserID;
    this.scopedWorkspace = data.scopedWorkspace;
    this.scopedWorkspaceID = data.scopedWorkspaceID;
    this.scopedApp = data.scopedApp;
    this.scopedAppID = data.scopedAppID;
    this.scopedMilestone = data.scopedMilestone;
    this.scopedMilestoneID = data.scopedMilestoneID;
    this.action = data.action;
    this.permissionLevel = data.permissionLevel;
    this.inheritanceLevel = data.inheritanceLevel;
    this.actionID = data.actionID;
    this.#pool = pool;

  }

  /**
   * Creates an access policy.
   * 
   * @param data The data for the new AccessPolicy, excluding the ID.
   * @returns The created AccessPolicy.
   */
  static async create(data: Omit<BaseAccessPolicyProperties, "id">, pool: Pool): Promise<AccessPolicy> {

    // Insert the access policy into the database.
    const poolClient = await pool.connect();

    try {
      
      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-access-policy-row.sql"), "utf8");
      const values = [
        data.principalType, 
        data.principalUserID, 
        data.principalGroupID, 
        data.principalRoleID,
        data.principalAppID,
        data.scopedResourceType, 
        data.scopedWorkspaceID, 
        data.scopedProjectID, 
        data.scopedItemID, 
        data.scopedActionID, 
        data.scopedRoleID, 
        data.scopedGroupID, 
        data.scopedUserID,
        data.scopedAppID,
        data.scopedMilestoneID,
        data.permissionLevel, 
        data.inheritanceLevel, 
        data.actionID
      ];
      const result = await poolClient.query<AccessPolicyQueryResult>(query, values);

      // Convert the row to an AccessPolicy object.
      const rowData = result.rows[0];
      const accessPolicy = new AccessPolicy(AccessPolicy.getPropertiesFromRow(rowData), pool);

      // Return the access policy.
      return accessPolicy;

    } finally {

      poolClient.release();

    }

  }

  static validatePropertyValue(propertyName: "inheritanceLevel", propertyValue: unknown): AccessPolicyInheritanceLevel;
  static validatePropertyValue(propertyName: "permissionLevel", propertyValue: unknown): AccessPolicyPermissionLevel;
  static validatePropertyValue(propertyName: string, propertyValue: unknown): unknown {

    if (propertyValue === undefined)
      return propertyValue;

    if (typeof(propertyValue) !== "string")
      throw new BadRequestError(`The ${propertyName} must be a string.`);

    switch (propertyName) {

      case "inheritanceLevel":

        if (!(propertyValue in AccessPolicyInheritanceLevel))
          throw new BadRequestError(`The ${propertyName} must be one of the following values: ${Object.values(AccessPolicyInheritanceLevel).join(", ")}.`);
        
        return propertyValue;

      case "permissionLevel":

        if (!(propertyValue in AccessPolicyPermissionLevel))
          throw new BadRequestError(`The ${propertyName} must be one of the following values: ${Object.values(AccessPolicyPermissionLevel).join(", ")}.`);
        
        return propertyValue;

      default:
        throw new BadRequestError(`The ${propertyName} is not a valid property.`);

    }

  }
  
  static async initializePreDefinedRoleAccessPolicies(classes: {"Action": typeof Action, "Role": typeof Role}, pool: Pool): Promise<AccessPolicy[]> {

    const permissions: {
      [preDefinedRoleName: string]: {
        actionName: string;
        permissionLevel: AccessPolicyPermissionLevel;
      }[];
    } = {
      "access-policy-admins": [
        {
          actionName: "slashstep.accessPolicies.get",
          permissionLevel: AccessPolicyPermissionLevel.Admin,
        },
        {
          actionName: "slashstep.accessPolicies.list",
          permissionLevel: AccessPolicyPermissionLevel.Admin,
        },
        {
          actionName: "slashstep.accessPolicies.update",
          permissionLevel: AccessPolicyPermissionLevel.Admin,
        },
        {
          actionName: "slashstep.accessPolicies.delete",
          permissionLevel: AccessPolicyPermissionLevel.Admin
        },
        {
          actionName: "slashstep.accessPolicies.create",
          permissionLevel: AccessPolicyPermissionLevel.Admin
        },
      ],
      "access-policy-editors": [
        {
          actionName: "slashstep.accessPolicies.get",
          permissionLevel: AccessPolicyPermissionLevel.Editor,
        },
        {
          actionName: "slashstep.accessPolicies.list",
          permissionLevel: AccessPolicyPermissionLevel.Editor,
        },
        {
          actionName: "slashstep.accessPolicies.update",
          permissionLevel: AccessPolicyPermissionLevel.Editor,
        },
        {
          actionName: "slashstep.accessPolicies.delete",
          permissionLevel: AccessPolicyPermissionLevel.Editor
        },
        {
          actionName: "slashstep.accessPolicies.create",
          permissionLevel: AccessPolicyPermissionLevel.Editor
        },
      ],
      "access-policy-users": [
        {
          actionName: "slashstep.accessPolicies.get",
          permissionLevel: AccessPolicyPermissionLevel.User,
        },
        {
          actionName: "slashstep.accessPolicies.list",
          permissionLevel: AccessPolicyPermissionLevel.User,
        },
        {
          actionName: "slashstep.accessPolicies.update",
          permissionLevel: AccessPolicyPermissionLevel.User,
        },
        {
          actionName: "slashstep.accessPolicies.delete",
          permissionLevel: AccessPolicyPermissionLevel.User
        },
        {
          actionName: "slashstep.accessPolicies.create",
          permissionLevel: AccessPolicyPermissionLevel.User
        }
      ],
      "read-only-access-policy-users": [
        {
          actionName: "slashstep.accessPolicies.get",
          permissionLevel: AccessPolicyPermissionLevel.User,
        },
        {
          actionName: "slashstep.accessPolicies.list",
          permissionLevel: AccessPolicyPermissionLevel.User,
        },
      ]
    };

    const accessPolicies = [];

    for (const preDefinedRoleName of Object.keys(permissions)) {

      const preDefinedRole = await classes.Role.getByName(preDefinedRoleName, pool);

      for (const permission of permissions[preDefinedRoleName]) {

        const action = await classes.Action.getByName(permission.actionName, pool);
        const accessPolicy = await AccessPolicy.create({
          principalType: "Role",
          principalRoleID: preDefinedRole.id,
          actionID: action.id,
          permissionLevel: permission.permissionLevel,
          inheritanceLevel: "Enabled",
          scopedResourceType: "Instance"
        }, pool);

        accessPolicies.push(accessPolicy);

      }

    }

    return accessPolicies;

  }

  static async initializeActions(actionClass: typeof Action, pool: Pool): Promise<Action[]> {

    const actionPropertiesList: InitialWritableActionProperties[] = [
      {
        name: "slashstep.accessPolicies.get",
        displayName: "Get access policy",
        description: "View an access policy."
      },
      {
        name: "slashstep.accessPolicies.list",
        displayName: "List access policies",
        description: "List access policies on a particular scope."
      },
      {
        name: "slashstep.accessPolicies.create",
        displayName: "Create access policies",
        description: "Create access policies on a particular scope."
      },
      {
        name: "slashstep.accessPolicies.update",
        displayName: "Update access policies",
        description: "Manage access policies on a particular scope."
      },
      {
        name: "slashstep.accessPolicies.delete",
        displayName: "Delete access policies",
        description: "Delete access policies on a particular scope."
      }
    ];

    const actions = [];
    for (const actionProperties of actionPropertiesList) {

      try {

        const action = await actionClass.create(actionProperties, pool);
        actions.push(action);

      } catch (error) {

        if (error instanceof ResourceConflictError) {

          const action = await actionClass.getByName(actionProperties.name, pool);
          actions.push(action);

        } else {

          throw error;

        }

      }

    }

    return actions;

  }

  static async initializePreDefinedRoles(roleClass: typeof Role, pool: Pool): Promise<Role[]> {

    const roleDataList: Omit<InitialWritableRoleProperties, "parentResourceType">[] = [
      {
        name: "access-policy-admins",
        displayName: "Access policy admins",
        description: "Principals with full control over access policies."
      },
      {
        name: "access-policy-editors",
        displayName: "Access policy editors",
        description: "Principals with editor access over access policies."
      },
      {
        name: "access-policy-users",
        displayName: "Access policy users",
        description: "Principals with user access over access policies."
      },
      {
        name: "read-only-access-policy-users",
        displayName: "Read-only access policy users",
        description: "Principals with read-only user access over access policies."
      }
    ];
    const roles = [];

    for (const roleData of roleDataList) {

      try {

        const role = await roleClass.create({
          ...roleData,
          isPreDefined: true,
          parentResourceType: "Instance"
        }, pool);
        roles.push(role);

      } catch (error) {

        if (error instanceof ResourceConflictError) {

          const role = await roleClass.getByName(roleData.name, pool);
          roles.push(role);

        } else {

          throw error;

        }
        
      }

    }

    return roles;

  }

  static async grantDefaultAdminPermissions(userID: string, pool: Pool): Promise<AccessPolicy[]> {

    const poolClient = await pool.connect();
    const rows = [];
    const adminActions = ["slashstep.users.register", "slashstep.items.create", "slashstep.accessPolicies.admin", "slashstep.sessions.create"];
    for (const adminAction of adminActions) {

      const result = await poolClient.query(readFileSync(resolve(dirname(import.meta.dirname), "AccessPolicy", "queries", "grant-admin-permissions.sql"), "utf8"), [userID, adminAction]);
      rows.push(...result.rows);

    }
    poolClient.release();

    const accessPolicies = rows.map(row => new AccessPolicy({
      id: row.id,
      principalType: row.principal_type,
      principalUserID: row.principal_user_id,
      principalGroupID: row.principal_group_id,
      principalRoleID: row.principal_role_id,
      scopedResourceType: row.scoped_resource_type,
      scopedWorkspaceID: row.scoped_workspace_id,
      scopedProjectID: row.scoped_project_id,
      scopedItemID: row.scoped_item_id,
      scopedActionID: row.scoped_action_id,
      scopedRoleID: row.scoped_role_id,
      scopedGroupID: row.scoped_group_id,
      scopedUserID: row.scoped_user_id,
      actionID: row.action_id,
      permissionLevel: row.permission_level,
      inheritanceLevel: row.inheritance_level
    }, pool));

    return accessPolicies;

  }

  private static mapIncludedResources(rowData: AccessPolicyQueryResult, includedResources: AccessPolicyIncludedResourceClassMap, pool: Pool): AccessPolicyIncludedResourceMap {

    const mappedResources: AccessPolicyIncludedResourceMap = {
      action: includedResources.action && rowData.action ? new includedResources.action(rowData.action, pool) : undefined,
      principalApp: includedResources.principalApp && rowData.principal_app ? new includedResources.principalApp(rowData.principal_app, pool) : undefined,
      principalUser: includedResources.principalUser && rowData.principal_user ? new includedResources.principalUser(rowData.principal_user, pool) : undefined,
      principalGroup: includedResources.principalGroup && rowData.principal_group ? new includedResources.principalGroup(rowData.principal_group, pool) : undefined,
      principalRole: includedResources.principalRole && rowData.principal_role ? new includedResources.principalRole(rowData.principal_role, pool) : undefined,
      scopedAction: includedResources.scopedAction && rowData.scoped_action ? new includedResources.scopedAction(rowData.scoped_action, pool) : undefined,
      scopedApp: includedResources.scopedApp && rowData.scoped_app ? new includedResources.scopedApp(rowData.scoped_app, pool) : undefined,
      scopedGroup: includedResources.scopedGroup && rowData.scoped_group ? new includedResources.scopedGroup(rowData.scoped_group, pool) : undefined,
      scopedItem: includedResources.scopedItem && rowData.scoped_item ? new includedResources.scopedItem(rowData.scoped_item, pool) : undefined,
      scopedMilestone: includedResources.scopedMilestone && rowData.scoped_milestone ? new includedResources.scopedMilestone(rowData.scoped_milestone, pool) : undefined,
      scopedProject: includedResources.scopedProject && rowData.scoped_project ? new includedResources.scopedProject(rowData.scoped_project, pool) : undefined,
      scopedRole: includedResources.scopedRole && rowData.scoped_role ? new includedResources.scopedRole(rowData.scoped_role, pool) : undefined,
      scopedUser: includedResources.scopedUser && rowData.scoped_user ? new includedResources.scopedUser(rowData.scoped_user, pool) : undefined,
      scopedWorkspace: includedResources.scopedWorkspace && rowData.scoped_workspace ? new includedResources.scopedWorkspace(rowData.scoped_workspace, pool) : undefined
    };

    return mappedResources;

  }

  /** 
   * Requests the server to return a list of access policies.
   * @param filterQuery A SlashstepQL filter to apply to the list of access policies.
   */
  static async list(filterQuery: string, pool: Pool, includedResources: AccessPolicyIncludedResourceClassMap = {}): Promise<AccessPolicy[]> {

    // Get the list from the database.
    const { whereClause, values, limit, offset } = SlashstepQLFilterSanitizer.sanitize({ 
      tableName: "hydrated_access_policies", 
      filterQuery, 
      defaultLimit: 1000, 
      allowedQueryFields: this.allowedQueryFields
    });
    const finalQuery = `select * from hydrated_access_policies${whereClause ? ` where ${whereClause}` : ""}${limit !== undefined ? ` limit ${limit}` : ""}${offset !== undefined ? ` offset ${offset}` : ""}`;
    
    let result;
    const poolClient = await pool.connect();

    try {

      result = await poolClient.query<AccessPolicyQueryResult>(finalQuery, values);

    } finally {

      poolClient.release();

    }

    // Convert the list of rows to AccessPolicy objects.
    const accessPolicies: AccessPolicy[] = [];
    for (const row of result.rows) {

      const accessPolicy = new AccessPolicy({
        ...AccessPolicy.getPropertiesFromRow(row),
        ...AccessPolicy.mapIncludedResources(row, includedResources, pool)
      }, pool);

      accessPolicies.push(accessPolicy);

    }

    // Return the list.
    return accessPolicies;

  }

  static async count(filterQuery: string, pool: Pool): Promise<number> {

    // Get the list from the database.
    const poolClient = await pool.connect();

    try {

      const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({
        tableName: "hydrated_access_policies",
        filterQuery,
        shouldIgnoreOffset: true,
        shouldIgnoreLimit: true,
        allowedQueryFields: this.allowedQueryFields
      });
      const result = await poolClient.query(`select count(*) from hydrated_access_policies${whereClause ? ` where ${whereClause}` : ""}`, values);
      
      // Convert the list of rows to AccessPolicy objects.
      const count = parseInt(result.rows[0].count, 10);

      // Return the list.
      return count;

    } finally {

      poolClient.release();

    }

  }

  /**
   * Creates the accessPolicies table in the database.
   * @param pool 
   */
  static async initializeTable(pool: Pool): Promise<void> {

    // Create the table.
    const poolClient = await pool.connect();
    try {

      const createAccessPoliciesTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-access-policies-table.sql"), "utf8");
      const createHydratedAccessPoliciesViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-access-policies-view.sql"), "utf8");
      await poolClient.query(createAccessPoliciesTableQuery);
      await poolClient.query(createHydratedAccessPoliciesViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: AccessPolicyQueryResult): BaseAccessPolicyProperties {
      
    return {
      id: rowData.id,
      principalType: rowData.principal_type,
      principalAppID: rowData.principal_app_id,
      principalUserID: rowData.principal_user_id,
      principalGroupID: rowData.principal_group_id,
      principalRoleID: rowData.principal_role_id,
      scopedResourceType: rowData.scoped_resource_type,
      scopedWorkspaceID: rowData.scoped_workspace_id,
      scopedProjectID: rowData.scoped_project_id,
      scopedItemID: rowData.scoped_item_id,
      scopedActionID: rowData.scoped_action_id,
      scopedRoleID: rowData.scoped_role_id,
      scopedGroupID: rowData.scoped_group_id,
      scopedUserID: rowData.scoped_user_id,
      scopedAppID: rowData.scoped_app_id,
      scopedMilestoneID: rowData.scoped_milestone_id,
      actionID: rowData.action_id,
      permissionLevel: rowData.permission_level,
      inheritanceLevel: rowData.inheritance_level
    };
    
  }

  static async getByID(id: string, pool: Pool): Promise<AccessPolicy> {

    // Get the access policy data from the database.
    const poolClient = await pool.connect();
    
    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-access-policy-by-id.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      // Make sure the access policy data exists.
      const data = result.rows[0];

      if (!data) {

        throw new ResourceNotFoundError("AccessPolicy");

      }

      // Return the access policy.
      const accessPolicy = new AccessPolicy(this.getPropertiesFromRow(data), pool);
      return accessPolicy;

    } catch (error) {
      
      if (error instanceof DatabaseError && error.code === "22P02") {

        throw new BadRequestError("The access policy ID must be a UUID.");

      }

      throw error;
      
    } finally {

      poolClient.release();

    }

  }

  /**
   * Requests the server to return a specific access policy by ID.
   * @param id The ID of the access policy to retrieve.
   * @param client The client used to make requests.
   * @returns The requested access policy.
   */
  static async listScopedAccessPolicies(actionID: string, pool: Pool, principalData: AccessPolicyPrincipalData, scope: AccessPolicyScopeData = {scopedResourceType: "Instance"}): Promise<AccessPolicy[]> {

    // Get the user's access policies.
    const scopeArray = [];
    const addToScopeArray = (javascriptKey: keyof typeof scope, sqlField: string) => {

      if (!scope[javascriptKey]) {
        
        return;

      }

      scopeArray.push(`${sqlField} = '${scope[javascriptKey]}'`);

    }

    addToScopeArray("actionID", "scopedActionID");
    addToScopeArray("appID", "scopedAppID");
    addToScopeArray("groupID", "scopedGroupID");
    addToScopeArray("itemID", "scopedItemID");
    addToScopeArray("milestoneID", "scopedMilestoneID");
    addToScopeArray("projectID", "scopedProjectID");
    addToScopeArray("roleID", "scopedRoleID");
    addToScopeArray("userID", "scopedUserID"); 
    addToScopeArray("workspaceID", "scopedWorkspaceID");

    let principalClause = "";
    switch (principalData.principalType) {

      case AccessPolicyPrincipalType.User:
        principalClause = `principalUserID = '${principalData.principalUserID}'`;
        break;

      case AccessPolicyPrincipalType.Group:
        principalClause = `principalGroupID = '${principalData.principalGroupID}'`;
        break;

      case AccessPolicyPrincipalType.Role:
        principalClause = `principalRoleID = '${principalData.principalRoleID}'`;
        break;

      case AccessPolicyPrincipalType.App:
        principalClause = `principalAppID = '${principalData.principalAppID}'`;
        break;

      default:
        throw new Error("Unexpected principal type.");

    }

    scopeArray.push("scopedResourceType = 'Instance'");

    const scopedAccessPolicies = await AccessPolicy.list(`actionID = '${actionID}' and ${principalClause} and (${scopeArray.join(" or ")})`, pool);

    return scopedAccessPolicies;

  }

  static async getAccessPolicyWithDeepestScope(actionID: string, pool: Pool, principalData: AccessPolicyPrincipalData, scopeData: AccessPolicyScopeData): Promise<AccessPolicy> {

    const scopedAccessPolicies = await AccessPolicy.listScopedAccessPolicies(actionID, pool, principalData, scopeData);
    const actionAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Action);
    const actionLogEntryAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.ActionLogEntry);
    const appAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.App);
    const groupAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Group);
    const itemAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Item);
    const milestoneAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Milestone);
    const projectAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Project);
    const roleAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Role);
    const userAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.User);
    const workspaceAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Workspace);
    const instanceAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Instance);

    const deepestAccessPolicyMap: {
      [scopedResourceType in AccessPolicyScopedResourceType]: AccessPolicy | undefined;
    } = {
      [AccessPolicyScopedResourceType.Action]: actionAccessPolicy ?? appAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.ActionLogEntry]: actionLogEntryAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.App]: appAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.Group]: groupAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.Instance]: instanceAccessPolicy,
      [AccessPolicyScopedResourceType.Item]: itemAccessPolicy ?? projectAccessPolicy ?? workspaceAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.Milestone]: milestoneAccessPolicy ?? projectAccessPolicy ?? workspaceAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.Project]: projectAccessPolicy ?? workspaceAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.Role]: roleAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.User]: userAccessPolicy ?? instanceAccessPolicy,
      [AccessPolicyScopedResourceType.Workspace]: workspaceAccessPolicy ?? instanceAccessPolicy,
    };

    const deepestAccessPolicy = deepestAccessPolicyMap[scopeData.scopedResourceType];

    if (!deepestAccessPolicy) {

      throw new ResourceNotFoundError("AccessPolicy");

    }

    return deepestAccessPolicy;

  }

  async getScopeData(resourceClasses: Omit<ScopeResourceClassMap, "Workspace" | "User"> = {}): Promise<AccessPolicyScopeData> {

    const { Action, App, Group, Item, Milestone, Project, Role } = resourceClasses;

    switch (this.scopedResourceType) {

      case AccessPolicyScopedResourceType.Action: {

        if (!Action) {

          throw new Error("Action class required.");

        }

        if (!this.scopedActionID) {

          throw new Error("Access policy is missing scopedActionID.");

        }

        const action = await Action.getByID(this.scopedActionID, this.#pool);

        return {
          scopedResourceType: AccessPolicyScopedResourceType.Action,
          actionID: this.scopedActionID,
          appID: action.appID
        };

      }

      case AccessPolicyScopedResourceType.App: {

        if (!App) {

          throw new Error("App class required.");

        }

        if (!this.scopedAppID) {

          throw new Error("Access policy is missing scopedAppID.");

        }

        const app = await App.getByID(this.scopedAppID, this.#pool);

        return {
          scopedResourceType: AccessPolicyScopedResourceType.App,
          appID: this.scopedAppID
        };

      }

      case AccessPolicyScopedResourceType.Group: {

        if (!Group) {

          throw new Error("Group class required.");

        }

        if (!this.scopedGroupID) {

          throw new Error("Access policy is missing scopedGroupID.");

        }

        const group = await Group.getByID(this.scopedGroupID, this.#pool);

        return {
          scopedResourceType: AccessPolicyScopedResourceType.Group,
          groupID: this.scopedGroupID
        };

      }

      case AccessPolicyScopedResourceType.Instance:
        return {
          scopedResourceType: AccessPolicyScopedResourceType.Instance
        };

      case AccessPolicyScopedResourceType.Item: {

        if (!Item) {

          throw new Error("Item class required.");

        }

        if (!this.scopedItemID) {

          throw new Error("Access policy is missing scopedItemID.");

        }

        const item = await Item.getByID(this.scopedItemID, this.#pool);

        return {
          scopedResourceType: AccessPolicyScopedResourceType.Item,
          itemID: this.scopedItemID,
          projectID: item.projectID,
          workspaceID: item.projectID
        };

      }

      case AccessPolicyScopedResourceType.Milestone: {

        if (!Milestone) {

          throw new Error("Milestone class required.");

        }

        if (!this.scopedMilestoneID) {

          throw new Error("Access policy is missing scopedMilestoneID.");

        }

        const milestone = await Milestone.getByID(this.scopedMilestoneID, this.#pool);

        return {
          scopedResourceType: AccessPolicyScopedResourceType.Milestone,
          milestoneID: this.scopedMilestoneID,
          projectID: milestone.parentProjectID,
          workspaceID: milestone.parentWorkspaceID
        };

      }

      case AccessPolicyScopedResourceType.Project: {

        if (!Project) {

          throw new Error("Project class required.");

        }

        if (!this.scopedProjectID) {

          throw new Error("Access policy is missing scopedProjectID.");

        }

        const project = await Project.getByID(this.scopedProjectID, this.#pool);

        return {
          scopedResourceType: AccessPolicyScopedResourceType.Project,
          projectID: this.scopedProjectID,
          workspaceID: project.workspaceID
        };

      }

      case AccessPolicyScopedResourceType.Role: {

        if (!Role) {

          throw new Error("Role class required.");

        }

        if (!this.scopedRoleID) {

          throw new Error("Access policy is missing scopedRoleID.");

        }

        const role = await Role.getByID(this.scopedRoleID, this.#pool);

        return {
          scopedResourceType: AccessPolicyScopedResourceType.Role,
          roleID: this.scopedRoleID
        };

      }

      case AccessPolicyScopedResourceType.User: {

        if (!this.scopedUserID) {

          throw new Error("Access policy is missing scopedUserID.");

        }

        return {
          scopedResourceType: AccessPolicyScopedResourceType.User,
          userID: this.scopedUserID
        };

      }

      case AccessPolicyScopedResourceType.Workspace:

        return {
          scopedResourceType: AccessPolicyScopedResourceType.Workspace,
          workspaceID: this.scopedWorkspaceID
        };

      default:
        throw new Error(`Unexpected scoped resource type: ${this.scopedResourceType}`);

    }

  }

  /**
   * Deletes this access policy.
   */
  async delete(): Promise<void> {

    const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-access-policy.sql"), "utf8");
    const poolClient = await this.#pool.connect();
    
    try {

      await poolClient.query(query, [this.id]);

    } finally {

      poolClient.release();

    }

  }

  /**
   * Updates the access policy.
   */
  async update(data: Partial<EditableAccessPolicyProperties>): Promise<AccessPolicy> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      let query = "update access_policies set ";
      const values = [];

      const addValue = <T>(columnName: string, value: T) => {

        if (value === undefined) {

          return;

        }

        query += `${values.length > 0 ? ", " : ""}${columnName} = $${values.length + 1}`;
        values.push(value);

      }
      addValue("permission_level", data.permissionLevel);
      addValue("inheritance_level", data.inheritanceLevel);

      query += ` where id = $${values.length + 1} returning *;`;
      values.push(this.id);
      
      const result = await poolClient.query(query, values);
      await poolClient.query("commit;");

      // Convert the row to an access policy object.
      const row = result.rows[0];
      const accessPolicy = new AccessPolicy(AccessPolicy.getPropertiesFromRow(row), this.#pool);

      return accessPolicy;

    } finally {

      poolClient.release();

    }

  }

}
