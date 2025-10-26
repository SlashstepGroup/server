import HTTPError from "./HTTPError.js";

export default class ResourceConflictError extends HTTPError {
  
  constructor(resourceType: string = "Resource") {

    super(409, `${resourceType} already exists.`);

  }

}