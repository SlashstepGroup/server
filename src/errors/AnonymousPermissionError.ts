import UnauthenticatedError from "./UnauthenticatedError.js";

export default class AnonymousPermissionError extends UnauthenticatedError {
  
  constructor(actionName?: string) {

    super(`You don't have permission to perform ${actionName ? `the ${actionName} action` : "this action"}. Verify your access policies or contact your administrator for more information.`);

  }

}