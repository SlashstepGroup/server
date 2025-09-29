import Server from "#utilities/Server/Server.js";

const { APP_ENVIRONMENT, APP_PORT } = process.env;

function assertIsDefined<T>(name: string, value: T): asserts value is NonNullable<T> {

  if (value === undefined || value === null) {

    throw new Error(`${name} must be defined.`);

  }

}

assertIsDefined("APP_ENVIRONMENT", APP_ENVIRONMENT);
assertIsDefined("APP_PORT", APP_PORT);

const port = parseInt(APP_PORT, 10);
if (isNaN(port)) {

  throw new Error("APP_PORT must be a number.");

}

const server = new Server({
  environment: APP_ENVIRONMENT,
  port
});

const shouldEnableSetupMode = process.argv.find(arg => arg.toLowerCase() === "--setup") !== undefined;

if (shouldEnableSetupMode) {

  await server.setup();

} else {

  await server.start();

}