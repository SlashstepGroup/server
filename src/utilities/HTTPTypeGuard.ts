import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import Principal from "src/interfaces/Principal.js";

export default class HTTPTypeGuard {

  static assertPrincipal<T extends Principal>(principal: T | null | undefined): asserts principal is T {
  
    if (!principal) {
  
      throw new UnauthenticatedError();
  
    }
  
  }

}