import HTTPError from "./HTTPError.js";

export default class UnauthenticatedError extends HTTPError {
  
  constructor(message = "Unauthenticated.") {

    super(401, message);

  }

}