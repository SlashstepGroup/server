import BadRequestError from "./BadRequestError.js";

export default class SlashstepQLInvalidQueryError extends BadRequestError {

  constructor() {

    super();
    this.message = "Invalid filter query.";

  }

}