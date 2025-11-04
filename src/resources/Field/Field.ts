import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { StringUnion } from "#utilities/types.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";

export enum FieldType {
  Text = "Text",
  Number = "Number",
  Date = "Date",
  Checkbox = "Checkbox",
  Stakeholder = "Stakeholder"
}

export enum FieldParentResourceType {
  Workspace = "Workspace",
  Project = "Project"
}

export type BaseFieldProperties = {
  id: string;
  name: string;
  displayName: string;
  type: StringUnion<FieldType>;
  description?: string | null;
  parentResourceType: StringUnion<FieldParentResourceType>;
  parentWorkspaceID?: string | null;
  parentProjectID?: string | null;
  areStakeholderReviewsEnabled?: boolean | null;
  minimumValue?: number | null;
  maximumValue?: number | null;
  minimumChoices?: number | null;
  maximumChoices?: number | null;
  isRequired: boolean;
}

export type FieldQueryResult = {
  id: string;
  name: string;
  display_name: string;
  type: StringUnion<FieldType>;
  description: string;
  parent_resource_type: StringUnion<FieldParentResourceType>;
  parent_workspace_id: string;
  parent_project_id: string;
  are_stakeholder_reviews_enabled: boolean;
  minimum_value: number;
  maximum_value: number;
  minimum_choices: number;
  maximum_choices: number;
  is_required: boolean;
}

export type InitialFieldProperties = Omit<BaseFieldProperties, "id">;

/**
 * A Field is a type of data structure that holds a value for a specific item.
 */
export default class Field {

  static readonly name = "Field";

  /** The field's ID. */
  readonly id: BaseFieldProperties["id"];

  /** The field's name. */
  readonly name: BaseFieldProperties["name"];

  /** The field's display name. */
  readonly displayName: BaseFieldProperties["displayName"];

  /** The field's type. */
  readonly type: BaseFieldProperties["type"];

  /** The field's description, if applicable. */
  readonly description: BaseFieldProperties["description"];

  /** The field's parent resource type. */
  readonly parentResourceType: BaseFieldProperties["parentResourceType"];

  /** The field's parent workspace ID. */
  readonly parentWorkspaceID: BaseFieldProperties["parentWorkspaceID"];

  /** The field's parent project ID. */
  readonly parentProjectID: BaseFieldProperties["parentProjectID"];

  /** Whether stakeholder reviews are enabled for this field. This only has an effect on stakeholder fields. */
  readonly areStakeholderReviewsEnabled: BaseFieldProperties["areStakeholderReviewsEnabled"];

  /** The minimum value for this field. This only has an effect on number fields. */
  readonly minimumValue: BaseFieldProperties["minimumValue"];

  /** The maximum value for this field. This only has an effect on number fields. */
  readonly maximumValue: BaseFieldProperties["maximumValue"];

  /** The minimum number of choices for this field. This only has an effect on choice fields. */
  readonly minimumChoices: BaseFieldProperties["minimumChoices"];

  /** The maximum number of choices for this field. This only has an effect on choice fields. */
  readonly maximumChoices: BaseFieldProperties["maximumChoices"];

  /** Whether the field is required. */
  readonly isRequired: BaseFieldProperties["isRequired"];

  readonly #pool: Pool;

  constructor(data: BaseFieldProperties, pool: Pool) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.type = data.type;
    this.description = data.description;
    this.parentResourceType = data.parentResourceType;
    this.parentWorkspaceID = data.parentWorkspaceID;
    this.parentProjectID = data.parentProjectID;
    this.areStakeholderReviewsEnabled = data.areStakeholderReviewsEnabled;
    this.minimumValue = data.minimumValue;
    this.maximumValue = data.maximumValue;
    this.minimumChoices = data.minimumChoices;
    this.maximumChoices = data.maximumChoices;
    this.isRequired = data.isRequired;
    this.#pool = pool;

  }

  static async getByID(id: string, pool: Pool): Promise<Field> {
  
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-field-row.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("Field");

      }

      const field = new Field(Field.getPropertiesFromRow(rowData), pool);

      return field;

    } finally {

      poolClient.release();

    }

  }

  static async create(data: InitialFieldProperties, pool: Pool): Promise<Field> {

    const poolClient = await pool.connect();

    try {
      
      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-field-row.sql"), "utf8");
      const values = [
        data.name,
        data.displayName,
        data.type,
        data.description,
        data.parentResourceType,
        data.parentWorkspaceID,
        data.parentProjectID,
        data.areStakeholderReviewsEnabled,
        data.minimumValue,
        data.maximumValue,
        data.minimumChoices,
        data.maximumChoices,
        data.isRequired
      ];
      const result = await poolClient.query<FieldQueryResult>(query, values);

      const rowData = result.rows[0];
      const accessPolicy = new Field(Field.getPropertiesFromRow(rowData), pool);

      return accessPolicy;

    } catch (error) {
      
      if (error instanceof DatabaseError && error.code === "23505") {

        throw new ResourceConflictError("Field");
        
      }

      throw error;
      
    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      await poolClient.query("begin;");
      const createFieldsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-fields-table.sql"), "utf8");
      const createHydratedFieldsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-fields-view.sql"), "utf8");
      await poolClient.query(createFieldsTableQuery);
      await poolClient.query(createHydratedFieldsViewQuery);
      await poolClient.query("commit;");

    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: FieldQueryResult): BaseFieldProperties {
        
    return {
      id: rowData.id,
      name: rowData.name,
      displayName: rowData.display_name,
      type: rowData.type,
      description: rowData.description,
      parentResourceType: rowData.parent_resource_type,
      parentWorkspaceID: rowData.parent_workspace_id,
      parentProjectID: rowData.parent_project_id,
      areStakeholderReviewsEnabled: rowData.are_stakeholder_reviews_enabled,
      minimumValue: rowData.minimum_value,
      maximumValue: rowData.maximum_value,
      minimumChoices: rowData.minimum_choices,
      maximumChoices: rowData.maximum_choices,
      isRequired: rowData.is_required
    };
    
  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    try {

      await poolClient.query("begin;");
      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-app-authorization-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);
      await poolClient.query("commit;");

    } finally {
      
      poolClient.release();

    }

  }

}