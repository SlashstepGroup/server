export type SlashstepQLSanitizedFilter = {
  query: string;
  values: unknown[];
}

export default class SlashstepQLFilterSanitizer {

  static sanitize(tableName: string, filterQuery: string): SlashstepQLSanitizedFilter {

    let query = `select * from ${tableName} where`;
    const values: string[] = [];
    let openParenthesisCount = 0;
    const searchRegex = /^((?<openParenthesis>\()|(?<closedParenthesis>\))|(?<and>and)|(?<or>or)|(?<not>not)|(?<assignment>(?<key>\w+) *= *(("(?<string>[^"\\]*(?:\\.[^"\\]*)*)")|(?<number>(\d+\.?\d*|(\.\d+)))|(?<boolean>(true|false))))|(limit ((?<limit>\d+)))|(offset ((?<offset>\d+))))/gmi;
    let maximumLimit = 1000;
    let limit = 1000;
    let offset = 0;

    while (filterQuery !== "") {

      // Remove unnecessary whitespace.
      filterQuery = filterQuery.trim();

      // Find the next search match.
      // Append the match to the actual filter query and remove it from the requested filter query.
      const match = searchRegex.exec(filterQuery);

      if (match === null || !match.groups) {
        
        throw new Error(`Invalid filter query.`);

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

        // Ensure the key is valid.
        const allowedKeys = ["principalType", "principalID", "scopeType", "scopeID", "actionID", "permissionLevel"];
        const key = match.groups.key;

        if (!allowedKeys.includes(key)) {
          throw new Error(`Invalid key "${key}" in filter query.`);
        }

        // Ensure the value is valid.
        const stringValue = match.groups.string;
        const numberValue = match.groups.number !== undefined ? parseFloat(match.groups.number) : undefined;
        const booleanValue = match.groups.boolean !== undefined ? match.groups.boolean === "true" : undefined;
        const value = stringValue ?? numberValue ?? booleanValue;

        query += ` ${key} = $${values.length + 1}`;
        values.push(value);

      } else if (match.groups.limit) {

        const possibleLimit = parseInt(match.groups.limit);
        if (isNaN(possibleLimit) || possibleLimit > maximumLimit || possibleLimit < 0) {

          throw new Error(`Invalid limit "${possibleLimit}" in filter query. It must be a non-negative integer less than or equal to ${maximumLimit}.`);

        }

        limit = possibleLimit;

      } else if (match.groups.offset) {

        const possibleOffset = parseInt(match.groups.offset);
        if (isNaN(possibleOffset) || possibleOffset < 0) {

          throw new Error(`Invalid offset "${possibleOffset}" in filter query. It must be a non-negative integer.`);

        }

        offset = possibleOffset;

      } else {

        throw new Error(`Invalid filter query.`);

      }

    }

    query += ` limit ${limit} offset ${offset}`;

    return {query, values};

  }

}