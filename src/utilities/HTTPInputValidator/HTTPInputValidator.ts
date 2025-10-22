import HTTPError from "#errors/HTTPError.js";

export type StringConstraints = {
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
}

export default class HTTPInputValidator {

  static verifyString(name: string, value: unknown, constraints: StringConstraints = {}): asserts value is string | undefined {
  
    const isValueMissing = value === undefined;
    if (isValueMissing && !constraints.isRequired) {

      return;

    }

    const isValueAString = typeof(value) === "string";
    if (!isValueAString) {

      throw new HTTPError(400, `${name} must be a string.`);
    
    }

    const isValueTooShort = constraints.minLength && value.length < constraints.minLength;
    if (isValueTooShort) {

      throw new HTTPError(400, `${name} must be at least ${constraints.minLength} characters long.`);

    }

    const isValueTooLong = constraints.maxLength && value.length > constraints.maxLength;
    if (isValueTooLong) {

      throw new HTTPError(400, `${name} must be at most ${constraints.maxLength} characters long.`);

    }

  }

  // static verifyExists(name: string, value: unknown) {
  
  //   if (value === undefined) {

  //     throw new HTTPError(400, `${name} must be provided.`);
    
  //   }

  // }
  
}