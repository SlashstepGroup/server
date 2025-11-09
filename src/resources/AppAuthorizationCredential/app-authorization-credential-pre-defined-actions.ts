import { InitialWritableActionProperties } from "#resources/Action/Action.js";

const appAuthorizationCredentialPreDefinedActions: InitialWritableActionProperties[] = [
  {
    name: "slashstep.appAuthorizationCredentials.get",
    displayName: "Get app authorization credential",
    description: "View an app authorization credential."
  },
  {
    name: "slashstep.appAuthorizationCredentials.list",
    displayName: "List app authorization credentials",
    description: "List app authorization credentials on a particular scope."
  },
  {
    name: "slashstep.appAuthorizationCredentials.create",
    displayName: "Create app authorization credentials",
    description: "Create app authorization credentials on a particular scope."
  }
]

export default appAuthorizationCredentialPreDefinedActions;