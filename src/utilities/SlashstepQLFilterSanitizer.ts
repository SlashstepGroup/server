import SlashstepQLInvalidQueryError from "#errors/SlashstepQLInvalidQueryError.js";
import SlashstepQLInvalidKeyError from "#errors/SlashstepQLInvalidKeyError.js";
import { escapeIdentifier } from "pg";

export type SlashstepQLSanitizedFilter = {
  query: string;
  values: unknown[];
}

export type SanitizeFunctionProperties = {
  tableName: string;
  filterQuery: string;
  columns?: string;
  defaultLimit?: number | null;
  maximumLimit?: number;
  shouldIgnoreLimit?: boolean;
  shouldIgnoreOffset?: boolean;
}

export default class SlashstepQLFilterSanitizer {

  static sanitize({tableName, filterQuery, columns = "*", defaultLimit = 1000, maximumLimit = 1000, shouldIgnoreLimit = false, shouldIgnoreOffset = false}: SanitizeFunctionProperties): SlashstepQLSanitizedFilter {

    let query = `select ${columns} from ${tableName}`;
    let didAddWhereClause = false;
    const values: string[] = [];
    let openParenthesisCount = 0;
    let limit = defaultLimit;
    let offset = null;

    while (filterQuery !== "") {

      // Remove unnecessary whitespace.
      filterQuery = filterQuery.trim();

      // Find the next search match.
      // Append the match to the actual filter query and remove it from the requested filter query.
      const searchRegex = /^((?<openParenthesis>\()|(?<closedParenthesis>\))|(?<and>and)|(?<or>or)|(?<not>not)|(?<assignment>(?<key>\w+) *(?<operator>~|~\*|!~|!~\*|=|>|<|>=|<=) *(("(?<stringDoubleQuotes>[^"\\]*(?:\\.[^"\\]*)*)")|(('(?<stringSingleQuotes>[^'\\]*(?:\\.[^'\\]*)*)'))|(?<number>(\d+\.?\d*|(\.\d+)))|(?<boolean>(true|false))))|(limit ((?<limit>\d+)))|(offset ((?<offset>\d+))))/gmi;
      const match = searchRegex.exec(filterQuery);

      if (match === null || !match.groups) {
        
        throw new SlashstepQLInvalidQueryError();

      }

      if (!didAddWhereClause && (match.groups.openParenthesis || match.groups.assignment)) {

        query += " where";
        didAddWhereClause = true;

      }

      if (match.groups.openParenthesis) { 

        openParenthesisCount++;
        query += " (";

      } else if (match.groups.closedParenthesis) {

        openParenthesisCount--;
        query += " )";

      } else if (match.groups.and) {

        query += " and";

      } else if (match.groups.or) {

        query += " or";

      } else if (match.groups.not) {

        query += " not";

      } else if (match.groups.assignment) {

        // Ensure the key is valid. Very important to prevent SQL injection.
        const allowedKeys: Record<string, string[]> = {
          camelcase_access_policies_view: ["principalType", "principalID", "scopeType", "scopeID", "actionID", "permissionLevel"],
          camelcase_items_view: ["id", "summary", "description", "projectID"]
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
        const value = stringValue ?? numberValue ?? booleanValue;
        query += ` ${escapeIdentifier(key)} ${operator} $${values.length + 1}`;
        values.push(value);

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
      filterQuery = filterQuery.slice(match[0].length + 1);

    }

    if (typeof(limit) === "number") {

      query += ` limit ${limit}`;

    }

    if (typeof(offset) === "number") {

      query += ` offset ${offset}`;

    }

    return {query, values};

  }

}