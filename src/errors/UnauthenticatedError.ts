import HTTPError from "./HTTPError.js";

export default class UnauthenticatedError extends HTTPError {
  
  constructor(actionName?: string) {

    super(401, `You don't have permission to perform ${actionName ? `the ${actionName} action` : "this action"}. Verify your access policies or contact your administrator for more information.`);

  }

}