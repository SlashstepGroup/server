import HTTPError from "./HTTPError.js";

export default class UnauthenticatedError extends HTTPError {
  
  constructor(message = "You don't have permission to perform this action. You probably need to sign in first.") {

    super(401, message);

  }

}