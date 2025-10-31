import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import PermissionDeniedError from "#errors/PermissionDeniedError.js";
import Action, { InitialWritableActionProperties } from "#resources/Action/Action.js";
import App from "#resources/App/App.js";
import Group from "#resources/Group/Group.js";
import Item from "#resources/Item/Item.js";
import Milestone, { MilestoneParentResourceType } from "#resources/Milestone/Milestone.js";
import Project from "#resources/Project/Project.js";
import Role, { InitialWritableRoleProperties, RoleParentResourceType } from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Workspace from "#resources/Workspace/Workspace.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";
import BadRequestError from "#errors/BadRequestError.js";
import Resource from "src/interfaces/Resource.js";

export type AccessPolicyIncludedResourceClassMap = {
  principalUser?: typeof User;
  principalGroup?: typeof Group;
  principalRole?: typeof Role;
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
  principalUser?: User;
  principalGroup?: Group;
  principalRole?: Role;
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
  Role = "Role"
}

export type BaseAccessPolicyProperties = {
  id: string;
  principalType: AccessPolicyPrincipalType;
  principalUserID?: string;
  principalGroupID?: string;
  principalRoleID?: string;
  scopedResourceType: AccessPolicyScopedResourceType;
  scopedActionID?: string;
  scopedAppID?: string;
  scopedGroupID?: string;
  scopedItemID?: string;
  scopedMilestoneID?: string;
  scopedProjectID?: string;
  scopedRoleID?: string;
  scopedUserID?: string;
  scopedWorkspaceID?: string;
  actionID: string;
  permissionLevel: AccessPolicyPermissionLevel;
  inheritanceLevel: AccessPolicyInheritanceLevel;
}

export type Scope = {
  actionID?: string;
  appID?: string;
  groupID?: string;
  itemID?: string;
  milestoneID?: string;
  projectID?: string;
  roleID?: string;
  userID?: string;
  workspaceID?: string;
};

export type ExtendedAccessPolicyProperties = BaseAccessPolicyProperties & {
  principalUser?: User;
  principalGroup?: Group;
  principalRole?: Role;
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
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  Iteration = "Iteration",
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
  principal_role_is_predefined: boolean;
  principal_role_description?: string;
  id: string;
  principal_type: AccessPolicyPrincipalType;
  principal_user_id?: string;
  principal_user_username?: string;
  principal_user_display_name?: string;
  principal_user_hashed_password?: string;
  principal_group_display_name?: string;
  principal_group_name?: string;
  principal_group_id?: string;
  principal_role_id?: string;
  principal_role_name?: string;
  principal_role_display_name?: string;
  principal_role_parent_resource_type?: RoleParentResourceType;
  principal_role_parent_workspace_id?: string;
  principal_role_parent_project_id?: string;
  principal_role_parent_group_id?: string;
  scoped_resource_type: AccessPolicyScopedResourceType;
  scoped_action_id?: string;
  scoped_action_name?: string;
  scoped_action_display_name?: string;
  scoped_action_description?: string;
  scoped_app_id?: string;
  scoped_app_name?: string;
  scoped_app_display_name?: string;
  scoped_app_description?: string;
  scoped_group_id?: string;
  scoped_group_display_name?: string;
  scoped_group_name?: string;
  scoped_item_id?: string;
  scoped_item_summary?: string;
  scoped_item_description?: string;
  scoped_item_project_id?: string;
  scoped_item_number?: string;
  scoped_milestone_id?: string;
  scoped_milestone_name?: string;
  scoped_milestone_display_name?: string;
  scoped_milestone_description?: string;
  scoped_milestone_parent_resource_type?: MilestoneParentResourceType;
  scoped_milestone_parent_project_id?: string;
  scoped_milestone_parent_workspace_id?: string;
  scoped_project_id?: string;
  scoped_project_name?: string;
  scoped_project_display_name?: string;
  scoped_project_key?: string;
  scoped_project_description?: string;
  scoped_project_start_date?: Date;
  scoped_project_end_date?: Date;
  scoped_project_workspace_id?: string;
  scoped_role_id?: string;
  scoped_role_name?: string;
  scoped_role_is_predefined?: boolean;
  scoped_role_description?: string;
  scoped_role_display_name?: string;
  scoped_role_parent_resource_type?: RoleParentResourceType;
  scoped_role_parent_workspace_id?: string;
  scoped_role_parent_project_id?: string;
  scoped_role_parent_group_id?: string;
  scoped_user_id?: string;
  scoped_user_username?: string;
  scoped_user_display_name?: string;
  scoped_user_hashed_password?: string;
  scoped_workspace_id?: string;
  scoped_workspace_name?: string;
  scoped_workspace_display_name?: string;
  action_id: string;
  action_name?: string;
  action_display_name?: string;
  action_description?: string;
  permission_level: AccessPolicyPermissionLevel;
  inheritance_level: AccessPolicyInheritanceLevel;
}

export type AccessPolicyPrincipalData = {
  principalType: AccessPolicyPrincipalType.User;
  principalUserID: string;
} | {
  principalType: AccessPolicyPrincipalType.Group;
  principalGroupID: string;
} | {
  principalType: AccessPolicyPrincipalType.Role;
  principalRoleID: string;
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
export default class AccessPolicy implements Resource<Scope> {

  static readonly name = "AccessPolicy";

  static readonly allowedQueryFields = {
    id: "id", 
    actionID: "action_id",
    principalType: "principal_type",
    principalUserID: "principal_user_id",
    principalGroupID: "principal_group_id",
    principalRoleID: "principal_role_id",
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
      const accessPolicy = new AccessPolicy({
        id: rowData.id,
        principalType: rowData.principal_type,
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
      }, pool);

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
  
  static async initializePreDefinedRoleAccessPolicies(actionClass: typeof Action, pool: Pool): Promise<AccessPolicy[]> {

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

      const preDefinedRole = await Role.getByName(preDefinedRoleName, pool);

      for (const permission of permissions[preDefinedRoleName]) {

        const action = await actionClass.getByName(permission.actionName, pool);
        const accessPolicy = await AccessPolicy.create({
          principalType: AccessPolicyPrincipalType.Role,
          principalRoleID: preDefinedRole.id,
          actionID: action.id,
          permissionLevel: permission.permissionLevel,
          inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
          scopedResourceType: AccessPolicyScopedResourceType.Instance
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
          parentResourceType: RoleParentResourceType.Instance
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

    const mappedResources: AccessPolicyIncludedResourceMap = {};

    // Principals
    let User = includedResources.principalUser;
    if (User && rowData.principal_user_id && rowData.principal_user_username && rowData.principal_user_display_name && rowData.principal_user_hashed_password) {

      mappedResources.principalUser = new User({
        id: rowData.principal_user_id,
        username: rowData.principal_user_username,
        displayName: rowData.principal_user_display_name,
        hashedPassword: rowData.principal_user_hashed_password
      }, pool);

    }

    let Group = includedResources.principalGroup;
    if (Group && rowData.principal_group_id && rowData.principal_group_display_name && rowData.principal_group_name) {

      mappedResources.principalGroup = new Group({
        id: rowData.principal_group_id,
        displayName: rowData.principal_group_display_name,
        name: rowData.principal_group_name
      }, pool);

    }

    let Role = includedResources.principalRole;
    if (Role && rowData.principal_role_id && rowData.principal_role_name && rowData.principal_role_display_name && rowData.principal_role_parent_resource_type) {

      mappedResources.principalRole = new Role({
        id: rowData.principal_role_id,
        name: rowData.principal_role_name,
        displayName: rowData.principal_role_display_name,
        isPreDefined: rowData.principal_role_is_predefined,
        description: rowData.principal_role_description,
        parentResourceType: rowData.principal_role_parent_resource_type,
        parentWorkspaceID: rowData.principal_role_parent_workspace_id,
        parentProjectID: rowData.principal_role_parent_project_id,
        parentGroupID: rowData.principal_role_parent_group_id
      }, pool);

    }

    // Scopes
    let Action = includedResources.scopedAction;
    if (Action && rowData.scoped_action_id && rowData.scoped_action_name && rowData.scoped_action_display_name && rowData.scoped_action_description) {

      mappedResources.scopedAction = new Action({
        id: rowData.scoped_action_id,
        name: rowData.scoped_action_name,
        displayName: rowData.scoped_action_display_name,
        description: rowData.scoped_action_description
      }, pool);

    }

    Action = includedResources.action;
    if (Action && rowData.action_id && rowData.action_name && rowData.action_display_name && rowData.action_description) {

      mappedResources.action = new Action({
        id: rowData.action_id,
        name: rowData.action_name,
        displayName: rowData.action_display_name,
        description: rowData.action_description
      }, pool);

    }

    const App = includedResources.scopedApp;
    if (App && rowData.scoped_app_id && rowData.scoped_app_name && rowData.scoped_app_display_name && rowData.scoped_app_description) {

      mappedResources.scopedApp = new App({
        id: rowData.scoped_app_id,
        name: rowData.scoped_app_name,
        displayName: rowData.scoped_app_display_name,
        description: rowData.scoped_app_description
      }, pool);

    }

    Group = includedResources.scopedGroup;
    if (Group && rowData.scoped_group_id && rowData.scoped_group_display_name && rowData.scoped_group_name) {

      mappedResources.scopedGroup = new Group({
        id: rowData.scoped_group_id,
        displayName: rowData.scoped_group_display_name,
        name: rowData.scoped_group_name
      }, pool);

    }
    
    const Item = includedResources.scopedItem;
    if (Item && rowData.scoped_item_id && rowData.scoped_item_summary && rowData.scoped_item_project_id && rowData.scoped_item_number) {

      mappedResources.scopedItem = new Item({
        id: rowData.scoped_item_id,
        summary: rowData.scoped_item_summary,
        description: rowData.scoped_item_description,
        projectID: rowData.scoped_item_project_id,
        number: rowData.scoped_item_number
      }, pool);

    }

    const Milestone = includedResources.scopedMilestone;
    if (Milestone && rowData.scoped_milestone_id && rowData.scoped_milestone_name && rowData.scoped_milestone_display_name && rowData.scoped_milestone_description && rowData.scoped_milestone_parent_resource_type) {

      mappedResources.scopedMilestone = new Milestone({
        id: rowData.scoped_milestone_id,
        name: rowData.scoped_milestone_name,
        displayName: rowData.scoped_milestone_display_name,
        description: rowData.scoped_milestone_description,
        parentResourceType: rowData.scoped_milestone_parent_resource_type,
        parentProjectID: rowData.scoped_milestone_parent_project_id,
        parentWorkspaceID: rowData.scoped_milestone_parent_workspace_id
      }, pool);

    }

    const Project = includedResources.scopedProject;
    if (Project && rowData.scoped_project_id && rowData.scoped_project_name && rowData.scoped_project_display_name && rowData.scoped_project_key && rowData.scoped_project_workspace_id) {

      mappedResources.scopedProject = new Project({
        id: rowData.scoped_project_id,
        name: rowData.scoped_project_name,
        displayName: rowData.scoped_project_display_name,
        key: rowData.scoped_project_key,
        description: rowData.scoped_project_description,
        startDate: rowData.scoped_project_start_date,
        endDate: rowData.scoped_project_end_date,
        workspaceID: rowData.scoped_project_workspace_id
      }, pool);

    }

    Role = includedResources.scopedRole;
    if (Role && rowData.scoped_role_id && rowData.scoped_role_name && rowData.scoped_role_display_name && rowData.scoped_role_parent_resource_type && rowData.scoped_role_is_predefined !== undefined) {

      mappedResources.scopedRole = new Role({
        id: rowData.scoped_role_id,
        name: rowData.scoped_role_name,
        displayName: rowData.scoped_role_display_name,
        isPreDefined: rowData.scoped_role_is_predefined,
        description: rowData.scoped_role_description,
        parentResourceType: rowData.scoped_role_parent_resource_type,
        parentWorkspaceID: rowData.scoped_role_parent_workspace_id,
        parentProjectID: rowData.scoped_role_parent_project_id,
        parentGroupID: rowData.scoped_role_parent_group_id
      }, pool);

    }

    User = includedResources.scopedUser;
    if (User && rowData.scoped_user_id && rowData.scoped_user_username && rowData.scoped_user_display_name && rowData.scoped_user_hashed_password) {

      mappedResources.scopedUser = new User({
        id: rowData.scoped_user_id,
        username: rowData.scoped_user_username,
        displayName: rowData.scoped_user_display_name,
        hashedPassword: rowData.scoped_user_hashed_password
      }, pool);

    }

    const Workspace = includedResources.scopedWorkspace;
    if (Workspace && rowData.scoped_workspace_id && rowData.scoped_workspace_name && rowData.scoped_workspace_display_name) {

      mappedResources.scopedWorkspace = new Workspace({
        id: rowData.scoped_workspace_id,
        name: rowData.scoped_workspace_name,
        displayName: rowData.scoped_workspace_display_name
      }, pool);

    }

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

      const { principalUser, principalGroup, principalRole, scopedAction, scopedApp, scopedGroup, scopedItem, scopedMilestone, scopedProject, scopedRole, scopedUser, scopedWorkspace, action } = AccessPolicy.mapIncludedResources(row, includedResources, pool);

      const accessPolicy = new AccessPolicy({
        id: row.id,
        principalType: row.principal_type,
        principalUser,
        principalUserID: row.principal_user_id,
        principalGroup,
        principalGroupID: row.principal_group_id,
        principalRole,
        principalRoleID: row.principal_role_id,
        scopedResourceType: row.scoped_resource_type,
        scopedWorkspace,
        scopedWorkspaceID: row.scoped_workspace_id,
        scopedProject,
        scopedProjectID: row.scoped_project_id,
        scopedItem,
        scopedItemID: row.scoped_item_id,
        scopedAction,
        scopedActionID: row.scoped_action_id,
        scopedRole,
        scopedRoleID: row.scoped_role_id,
        scopedGroup,
        scopedGroupID: row.scoped_group_id,
        scopedUser,
        scopedUserID: row.scoped_user_id,
        scopedApp,
        scopedAppID: row.scoped_app_id,
        scopedMilestone,
        scopedMilestoneID: row.scoped_milestone_id,
        action,
        actionID: row.action_id,
        permissionLevel: row.permission_level,
        inheritanceLevel: row.inheritance_level
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

      const createAccessPoliciesTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "AccessPolicy", "queries", "create-access-policies-table.sql"), "utf8");
      const createHydratedAccessPoliciesViewQuery = readFileSync(resolve(dirname(import.meta.dirname), "AccessPolicy", "queries", "create-hydrated-access-policies-view.sql"), "utf8");
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
  static async getByDeepestScope(actionID: string, pool: Pool, principalData: AccessPolicyPrincipalData, scope: Scope = {}): Promise<AccessPolicy> {

    // Get the user's access policies.
    const scopeArray = [];
    if (scope.itemID) {

      scopeArray.push(`scopedItemID = '${scope.itemID}'`);

    }

    if (scope.projectID) {

      scopeArray.push(`scopedProjectID = '${scope.projectID}'`);

    }

    if (scope.workspaceID) {

      scopeArray.push(`scopedWorkspaceID = '${scope.workspaceID}'`);

    }

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

      default:
        throw new Error("Unexpected principal type.");

    }

    scopeArray.push("scopedResourceType = 'Instance'");

    const accessPolicies = await AccessPolicy.list(`actionID = '${actionID}' and ${principalClause} and (${scopeArray.join(" or ")})`, pool);

    const instanceAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Instance");
    const workspaceAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Workspace");
    const projectAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Project");
    const itemAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Item");

    const accessPolicy = itemAccessPolicy ?? projectAccessPolicy ?? workspaceAccessPolicy ?? instanceAccessPolicy;

    if (!accessPolicy) {

      throw new ResourceNotFoundError("AccessPolicy");

    }

    return accessPolicy;

  }

  static async verifyPermissions(actionID: string, pool: Pool, principalData: AccessPolicyPrincipalData, requiredPermissionLevel: AccessPolicyPermissionLevel = AccessPolicyPermissionLevel.User, scope: Scope = {}) {

    try {

      const deepestAccessPolicy = await AccessPolicy.getByDeepestScope(actionID, pool, principalData, scope);

      if (deepestAccessPolicy.permissionLevel < requiredPermissionLevel) {

        throw new PermissionDeniedError();

      }

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new PermissionDeniedError();

      }

      throw error;

    }

  }

  async getAccessPolicyScopeData(resourceClasses: Omit<ScopeResourceClassMap, "Workspace" | "User"> = {}): Promise<Scope> {

    const { Action, App, Group, Item, Milestone, Project, Role } = resourceClasses;

    switch (this.scopedResourceType) {

      case AccessPolicyScopedResourceType.Action:

        if (!Action) {

          throw new Error("Action class required.");

        }

        if (!this.scopedActionID) {

          throw new Error("Access policy is missing scopedActionID.");

        }

        const action = await Action.getByID(this.scopedActionID, this.#pool);

        return {
          actionID: this.scopedActionID,
          appID: action.appID
        };

      case AccessPolicyScopedResourceType.App:

        if (!App) {

          throw new Error("App class required.");

        }

        if (!this.scopedAppID) {

          throw new Error("Access policy is missing scopedAppID.");

        }

        const app = await App.getByID(this.scopedAppID, this.#pool);

        return {
          appID: this.scopedAppID
        };

      case AccessPolicyScopedResourceType.Group:

        if (!Group) {

          throw new Error("Group class required.");

        }

        if (!this.scopedGroupID) {

          throw new Error("Access policy is missing scopedGroupID.");

        }

        const group = await Group.getByID(this.scopedGroupID, this.#pool);

        return {
          groupID: this.scopedGroupID
        };

      case AccessPolicyScopedResourceType.Instance:
        return {};

      case AccessPolicyScopedResourceType.Item:

        if (!Item) {

          throw new Error("Item class required.");

        }

        if (!this.scopedItemID) {

          throw new Error("Access policy is missing scopedItemID.");

        }

        const item = await Item.getByID(this.scopedItemID, this.#pool);

        return {
          itemID: this.scopedItemID,
          projectID: item.projectID,
          workspaceID: item.projectID
        };

      case AccessPolicyScopedResourceType.Milestone:

        if (!Milestone) {

          throw new Error("Milestone class required.");

        }

        if (!this.scopedMilestoneID) {

          throw new Error("Access policy is missing scopedMilestoneID.");

        }

        const milestone = await Milestone.getByID(this.scopedMilestoneID, this.#pool);

        return {
          milestoneID: this.scopedMilestoneID,
          projectID: milestone.parentProjectID,
          workspaceID: milestone.parentWorkspaceID
        };

      case AccessPolicyScopedResourceType.Project:

        if (!Project) {

          throw new Error("Project class required.");

        }

        if (!this.scopedProjectID) {

          throw new Error("Access policy is missing scopedProjectID.");

        }

        const project = await Project.getByID(this.scopedProjectID, this.#pool);

        return {
          projectID: this.scopedProjectID,
          workspaceID: project.workspaceID
        };

      case AccessPolicyScopedResourceType.Role:

        if (!Role) {

          throw new Error("Role class required.");

        }

        if (!this.scopedRoleID) {

          throw new Error("Access policy is missing scopedRoleID.");

        }

        const role = await Role.getByID(this.scopedRoleID, this.#pool);

        return {
          roleID: this.scopedRoleID
        };

      case AccessPolicyScopedResourceType.User:

        if (!User) {

          throw new Error("User class required.");

        }

        if (!this.scopedUserID) {

          throw new Error("Access policy is missing scopedUserID.");

        }

        return {
          userID: this.scopedUserID
        };

      case AccessPolicyScopedResourceType.Workspace:
        return {
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
