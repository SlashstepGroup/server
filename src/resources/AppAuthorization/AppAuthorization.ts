import BadRequestError from "#errors/BadRequestError.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { AccessPolicyScopedResourceType } from "#resources/AccessPolicy/AccessPolicy.js";
import Action, { InitialWritableActionProperties } from "#resources/Action/Action.js";
import type { default as App, AppProperties } from "#resources/App/App.js";
import Project, { ProjectProperties } from "#resources/Project/Project.js";
import User, { UserProperties } from "#resources/User/User.js";
import Workspace, { WorkspaceProperties } from "#resources/Workspace/Workspace.js";
import { StringUnion } from "#utilities/types.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { DatabaseError, Pool } from "pg";

export enum AppAuthorizationAuthorizingResourceType {
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  User = "User"
}

export type BaseAppAuthorizationProperties = {
  id: string;
  appID: string;
  authorizingResourceType: StringUnion<AppAuthorizationAuthorizingResourceType>;
  authorizingProjectID?: string | null;
  authorizingUserID?: string | null;
  authorizingWorkspaceID?: string | null;
}

export type ExtendedAppAuthorizationCredentialProperties = BaseAppAuthorizationProperties & {
  app?: App | null;
  authorizingProject?: Project | null;
  authorizingWorkspace?: Workspace | null;
  authorizingUser?: User | null;
}

export type AppAuthorizationQueryResult = {
  id: string;
  app: AppProperties | null;
  app_id: string;
  authorizing_resource_type: StringUnion<AppAuthorizationAuthorizingResourceType>;
  authorizing_project: ProjectProperties | null;
  authorizing_project_id: string | null;
  authorizing_user: UserProperties | null;
  authorizing_user_id: string | null;
  authorizing_workspace: WorkspaceProperties | null;
  authorizing_workspace_id: string | null;
}

export type AppAuthorizationScopeData = {
  scopedResourceType: AccessPolicyScopedResourceType.AppAuthorization;
  appAuthorizationID: string;
  userID?: string | null;
  projectID?: string | null;
  workspaceID?: string | null;
}

export type AppAuthorizationIncludedResourceClassMap = {
  app?: typeof App;
  authorizingProject?: typeof Project;
  authorizingUser?: typeof User;
  authorizingWorkspace?: typeof Workspace;
}

export type AppAuthorizationIncludedResourceMap = {
  [key in keyof AppAuthorizationIncludedResourceClassMap]?: InstanceType<NonNullable<AppAuthorizationIncludedResourceClassMap[key]>>;
}

export type InitialAppAuthorizationCredentialProperties = Omit<BaseAppAuthorizationProperties, "id">;

export type AppAuthorizationScopeDataResourceClassMap = {
  Project?: typeof Project;
}

export default class AppAuthorization {

  readonly id: BaseAppAuthorizationProperties["id"];

  readonly appID: BaseAppAuthorizationProperties["appID"];

  readonly authorizingResourceType: BaseAppAuthorizationProperties["authorizingResourceType"];

  readonly authorizingProjectID: BaseAppAuthorizationProperties["authorizingProjectID"];

  readonly authorizingUserID: BaseAppAuthorizationProperties["authorizingUserID"];

  readonly authorizingWorkspaceID: BaseAppAuthorizationProperties["authorizingWorkspaceID"];

  readonly app?: ExtendedAppAuthorizationCredentialProperties["app"];

  readonly authorizingProject?: ExtendedAppAuthorizationCredentialProperties["authorizingProject"];

  readonly authorizingWorkspace?: ExtendedAppAuthorizationCredentialProperties["authorizingWorkspace"];

  readonly authorizingUser?: ExtendedAppAuthorizationCredentialProperties["authorizingUser"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: ExtendedAppAuthorizationCredentialProperties, pool: Pool) {

    this.id = data.id;
    this.appID = data.appID;
    this.authorizingResourceType = data.authorizingResourceType;
    this.authorizingProject = data.authorizingProject;
    this.authorizingProjectID = data.authorizingProjectID;
    this.authorizingUser = data.authorizingUser;
    this.authorizingUserID = data.authorizingUserID;
    this.authorizingWorkspace = data.authorizingWorkspace;
    this.authorizingWorkspaceID = data.authorizingWorkspaceID;
    this.#pool = pool;

  }

  static getPropertiesFromRow(rowData: AppAuthorizationQueryResult): BaseAppAuthorizationProperties {
    
    return {
      id: rowData.id,
      appID: rowData.app_id,
      authorizingResourceType: rowData.authorizing_resource_type,
      authorizingProjectID: rowData.authorizing_project_id,
      authorizingUserID: rowData.authorizing_user_id,
      authorizingWorkspaceID: rowData.authorizing_workspace_id
    };
    
  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createAppsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-app-authorizations-table.sql"), "utf8");
      const createHydratedAppsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-app-authorizations-view.sql"), "utf8");
      await poolClient.query(createAppsTableQuery);
      await poolClient.query(createHydratedAppsViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static async getByID(id: string, pool: Pool): Promise<AppAuthorization> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-app-authorization-row.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("AppAuthorization");

      }

      const appAuthorizationCredential = new AppAuthorization(AppAuthorization.getPropertiesFromRow(rowData), pool);

      return appAuthorizationCredential;

    } catch (error) {
      
      if (error instanceof DatabaseError && error.code === "22P02") {

        throw new BadRequestError("The app authorization ID must be a UUID.");

      }

      throw error;

    } finally {

      poolClient.release();

    }

  }

  static async create(data: InitialAppAuthorizationCredentialProperties, pool: Pool, includedResources?: AppAuthorizationIncludedResourceClassMap): Promise<AppAuthorization> {

    const poolClient = await pool.connect();

    try {
      
      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-app-authorization-row.sql"), "utf8");
      const values = [
        data.appID,
        data.authorizingResourceType,
        data.authorizingProjectID,
        data.authorizingUserID,
        data.authorizingWorkspaceID
      ];
      const result = await poolClient.query<AppAuthorizationQueryResult>(query, values);

      const rowData = result.rows[0];
      const appAuthorizationProperties = AppAuthorization.getPropertiesFromRow(rowData);
      const mappedResources = includedResources ? AppAuthorization.mapIncludedResources(rowData, includedResources, pool) : {};
      const appAuthorization = new AppAuthorization({
        ...appAuthorizationProperties,
        ...mappedResources
      }, pool);

      return appAuthorization;

    } finally {

      poolClient.release();

    }

  }

  static async initializeActions(actionClass: typeof Action, pool: Pool): Promise<Action[]> {
    
    const actionPropertiesList: InitialWritableActionProperties[] = [
      {
        name: "slashstep.appAuthorizations.get",
        displayName: "Get app authorization",
        description: "View an app authorization."
      },
      {
        name: "slashstep.appAuthorizations.list",
        displayName: "List app authorizations",
        description: "List app authorizations on a particular scope."
      },
      {
        name: "slashstep.appAuthorizations.create",
        displayName: "Create app authorizations",
        description: "Create app authorizations on a particular scope."
      },
      {
        name: "slashstep.appAuthorizations.delete",
        displayName: "Delete app authorizations",
        description: "Delete app authorizations on a particular scope."
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

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-app-authorization-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);

    } finally {
      
      poolClient.release();

    }

  }

  static mapIncludedResources(rowData: AppAuthorizationQueryResult, includedResources: AppAuthorizationIncludedResourceClassMap, pool: Pool): AppAuthorizationIncludedResourceMap {

    const mappedResources: AppAuthorizationIncludedResourceMap = {
      app: includedResources.app && rowData.app ? new includedResources.app(rowData.app, pool) : undefined,
      authorizingProject: includedResources.authorizingProject && rowData.authorizing_project ? new includedResources.authorizingProject(rowData.authorizing_project, pool) : undefined,
      authorizingUser: includedResources.authorizingUser && rowData.authorizing_user ? new includedResources.authorizingUser(rowData.authorizing_user, pool) : undefined,
      authorizingWorkspace: includedResources.authorizingWorkspace && rowData.authorizing_workspace ? new includedResources.authorizingWorkspace(rowData.authorizing_workspace, pool) : undefined
    }; 

    return mappedResources;

  }

  async getScopeData(resourceClasses: AppAuthorizationScopeDataResourceClassMap): Promise<AppAuthorizationScopeData> {

    let workspaceID = this.authorizingWorkspaceID;
    if (this.authorizingProjectID) {

      if (!resourceClasses.Project) {

        throw new Error("Project class required to get workspace ID.");

      }

      const project = await resourceClasses.Project.getByID(this.authorizingProjectID, this.#pool);
      workspaceID = project.workspaceID;

    }

    return {
      scopedResourceType: AccessPolicyScopedResourceType.AppAuthorization,
      userID: this.authorizingUserID,
      appAuthorizationID: this.id,
      projectID: this.authorizingProjectID,
      workspaceID: workspaceID
    }

  }

}