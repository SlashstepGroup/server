import Server from "#utilities/Server/Server.js";
import { Client as VaultClient } from "@litehex/node-vault";

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

// Get the PostgreSQL connection information.
const { POSTGRESQL_HOST, POSTGRESQL_PORT: rawPostgresqlPort, POSTGRESQL_DATABASE_NAME } = process.env;
const POSTGRESQL_PORT = rawPostgresqlPort ? parseInt(rawPostgresqlPort, 10) : undefined;

assertIsDefined("POSTGRESQL_HOST", POSTGRESQL_HOST);
assertIsDefined("POSTGRESQL_PORT", POSTGRESQL_PORT);
assertIsDefined("POSTGRESQL_DATABASE_NAME", POSTGRESQL_DATABASE_NAME);

// Get the PostgreSQL credentials.
const { VAULT_ENDPOINT, VAULT_ROLE_ID } = process.env;
assertIsDefined("VAULT_ENDPOINT", VAULT_ENDPOINT);
assertIsDefined("VAULT_ROLE_ID", VAULT_ROLE_ID);

const vault = new VaultClient({
  endpoint: VAULT_ENDPOINT
});

// TODO: Get secret_id
const result = await vault.write({
  path: "auth/approle/role",
  data: {
    role_id: VAULT_ROLE_ID
  }
});

// Get the PostgreSQL credentials.
const server = new Server({
  environment: APP_ENVIRONMENT,
  port,
  postgreSQLUsername: "",
  postgreSQLPassword: "",
  postgreSQLHost: POSTGRESQL_HOST,
  postgreSQLPort: POSTGRESQL_PORT,
  postgreSQLDatabaseName: POSTGRESQL_DATABASE_NAME
});

const shouldEnableSetupMode = process.argv.find(arg => arg.toLowerCase() === "--setup") !== undefined;

if (shouldEnableSetupMode) {

  await server.setup();

} else {

  await server.start();

}