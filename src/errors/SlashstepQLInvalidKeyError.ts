import BadRequestError from "./BadRequestError.js";

export default class SlashstepQLInvalidKeyError extends BadRequestError {

  constructor(key: string) {

    super();
    this.message = `Invalid key "${key}" in filter query.`;

  }

}