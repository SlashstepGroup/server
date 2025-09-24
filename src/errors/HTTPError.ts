export default class HTTPError extends Error {

  #statusCode: number;
  message: string;

  constructor(statusCode: number, message: string) {

    super(message);
    this.#statusCode = statusCode;
    this.message = message;

  }

  getStatusCode(): number {

    return this.#statusCode;

  }

}