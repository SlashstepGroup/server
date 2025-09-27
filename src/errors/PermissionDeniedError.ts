import HTTPError from "./HTTPError.js";

export default class PermissionDeniedError extends HTTPError {
  
  constructor() {

    super(403, "You don't have permission to perform this action. Check your access policies.");

  }

}