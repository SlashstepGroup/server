import HTTPError from "./HTTPError.js";

export default class ResourceNotFoundError extends HTTPError {
  
  constructor(resourceType: string = "Resource") {

    super(404, `${resourceType} not found.`);

  }

}