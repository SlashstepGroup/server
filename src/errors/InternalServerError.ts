import HTTPError from "./HTTPError.js";

export default class InternalServerError extends HTTPError {
  
  constructor(message = "Internal server error.") {

    super(500, message);

  }

}