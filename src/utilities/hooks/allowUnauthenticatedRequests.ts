import { NextFunction, Request, Response } from "express";

async function allowUnauthenticatedRequests(_request: Request, response: Response<unknown, { areUnauthenticatedRequestsAllowed?: boolean }>, next: NextFunction) {

  response.locals.areUnauthenticatedRequestsAllowed = true;
  next();

}

export default allowUnauthenticatedRequests;