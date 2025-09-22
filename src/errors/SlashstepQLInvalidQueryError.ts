export default class SlashstepQLInvalidQueryError extends Error {

  constructor() {

    super();
    this.message = "Invalid filter query.";

  }

}