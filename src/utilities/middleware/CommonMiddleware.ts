import { NextFunction, Request, Response } from "express";
import HTTPError from "#errors/HTTPError.js";
import InternalServerError from "#errors/InternalServerError.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";
import { ResponseLocals } from "#utilities/types.js";

export default class CommonMiddleware {

  static async handleErrors(error: unknown, request: Request, response: Response<unknown, ResponseLocals>, next: NextFunction) {

    const errorMessage = error instanceof HTTPError ? error.message : `${error}`;
    const httpError = error instanceof HTTPError ? error : new InternalServerError("Something bad happened on our side. Try again later.");

    const { server, httpRequest } = response.locals;
    await httpRequest.update({
      statusCode: httpError.getStatusCode()
    });

    await ServerLogEntry.create({
      message: errorMessage,
      httpRequestID: httpRequest.id,
      level: error instanceof HTTPError ? ServerLogEntryLevel.Error : ServerLogEntryLevel.Critical
    }, server.pool, true);

    if (!response.headersSent) {

      response.status(httpError.getStatusCode()).json(error);

    }

    next();

  }

}