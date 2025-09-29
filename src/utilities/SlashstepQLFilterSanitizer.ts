import SlashstepQLInvalidQueryError from "#errors/SlashstepQLInvalidQueryError.js";
import SlashstepQLInvalidKeyError from "#errors/SlashstepQLInvalidKeyError.js";
import { escapeIdentifier } from "pg";

export type SlashstepQLSanitizedFilter = {
  values: unknown[];
  whereClause?: string;
  limit?: number;
  offset?: number;
}

export type SanitizeFunctionProperties = {
  tableName: string;
  filterQuery: string;
  defaultLimit?: number;
  maximumLimit?: number;
  shouldIgnoreLimit?: boolean;
  shouldIgnoreOffset?: boolean;
}

export default class SlashstepQLFilterSanitizer {

  static sanitize({tableName, filterQuery, defaultLimit, maximumLimit, shouldIgnoreLimit = false, shouldIgnoreOffset = false}: SanitizeFunctionProperties): SlashstepQLSanitizedFilter {

    let whereClause = "";
    const values: string[] = [];
    let openParenthesisCount = 0;
    let limit = defaultLimit;
    let offset;

    while (filterQuery !== "") {

      // Remove unnecessary whitespace.
      filterQuery = filterQuery.trim();

      // Find the next search match.
      // Append the match to the actual filter query and remove it from the requested filter query.
      const searchRegex = /^((?<openParenthesis>\()|(?<closedParenthesis>\))|(?<and>and)|(?<or>or)|(?<not>not)|(?<assignment>(?<key>\w+) *(?<operator>is|~|~\*|!~|!~\*|=|>|<|>=|<=) *(("(?<stringDoubleQuotes>[^"\\]*(?:\\.[^"\\]*)*)")|(('(?<stringSingleQuotes>[^'\\]*(?:\\.[^'\\]*)*)'))|(?<number>(\d+\.?\d*|(\.\d+)))|(?<boolean>(true|false))|(?<null>null)))|(limit ((?<limit>\d+)))|(offset ((?<offset>\d+))))/gmi;
      const match = searchRegex.exec(filterQuery);

      if (match === null || !match.groups) {
        
        throw new SlashstepQLInvalidQueryError();

      }

      if (match.groups.openParenthesis) { 

        openParenthesisCount++;
        whereClause += " (";

      } else if (match.groups.closedParenthesis) {

        openParenthesisCount--;
        whereClause += " )";

      } else if (match.groups.and) {

        whereClause += " and";

      } else if (match.groups.or) {

        whereClause += " or";

      } else if (match.groups.not) {

        whereClause += " not";

      } else if (match.groups.assignment) {

        // Ensure the key is valid. Very important to prevent SQL injection.
        const allowedKeys: Record<string, string[]> = {
          hydrated_items: ["id", "summary", "description", "project_id"],
          hydrated_access_policies: ["id", "user_id", "scope_type", "workspace_id", "project_id", "item_id", "action_id", "permission_level", "inheritance_level"],
          hydrated_actions: ["id", "name", "display_name", "description"],
          hydrated_apps: ["id", "name", "display_name", "description"],
        };
        const key = match.groups.key;

        if (!allowedKeys[tableName].includes(key)) {
          throw new SlashstepQLInvalidKeyError(key);
        }

        // Ensure the value is valid.
        const stringValue = match.groups.stringDoubleQuotes ?? match.groups.stringSingleQuotes;
        const numberValue = match.groups.number !== undefined ? parseFloat(match.groups.number) : undefined;
        const { operator } = match.groups;
        const booleanValue = match.groups.boolean !== undefined ? match.groups.boolean === "true" : undefined;
        const nullValue = match.groups.null !== undefined ? null : undefined;
        const value = stringValue ?? numberValue ?? booleanValue ?? nullValue;
        whereClause += ` ${escapeIdentifier(key)} ${operator} ${value === null ? "null" : `$${values.length + 1}`}`;
        
        if (value !== null) {

          values.push(value);

        }

      } else if (match.groups.limit) {

        if (!shouldIgnoreLimit) {

          const possibleLimit = parseInt(match.groups.limit);
          const doesMaximumLimitExist = maximumLimit === undefined && maximumLimit === null;
          if (isNaN(possibleLimit) || (doesMaximumLimitExist && possibleLimit > maximumLimit) || possibleLimit < 0) {

            throw new Error(`Invalid limit "${possibleLimit}" in filter query. It must be a non-negative integer${doesMaximumLimitExist ? `less than or equal to ${maximumLimit}` : ""}.`);

          }

          limit = possibleLimit;

        }

      } else if (match.groups.offset) {

        if (!shouldIgnoreOffset) {

          const possibleOffset = parseInt(match.groups.offset);
          if (isNaN(possibleOffset) || possibleOffset < 0) {

            throw new Error(`Invalid offset "${possibleOffset}" in filter query. It must be a non-negative integer.`);

          }

          offset = possibleOffset;

        }

      } else {

        throw new SlashstepQLInvalidQueryError();

      }

      // Remove the matched part of the filter query.
      filterQuery = filterQuery.slice(match[0].length);

    }

    return {whereClause, values, limit, offset};

  }

}