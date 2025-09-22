export default class SlashstepQLInvalidKeyError extends Error {

  constructor(key: string) {

    super();
    this.message = `Invalid key "${key}" in filter query.`;

  }

}