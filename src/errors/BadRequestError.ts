import HTTPError from "./HTTPError.js";

export default class BadRequestError extends HTTPError {
  
  constructor(message = "Bad request.") {

    super(400, message);

  }

}