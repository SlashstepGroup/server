import HTTPError from "./HTTPError.js";

export default class PermissionDeniedError extends HTTPError {
  
  constructor(message = "You don't have permission to perform this action. Check your access policies.") {

    super(403, message);

  }

}