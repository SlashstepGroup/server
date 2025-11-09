import HTTPError from "./HTTPError.js";

export default class ForbiddenError extends HTTPError {
  
  constructor(actionName?: string) {

    super(403, `You don't have permission to perform ${actionName ? `the ${actionName} action` : "this action"}. Verify your access policies or contact your administrator for more information.`);

  }

}