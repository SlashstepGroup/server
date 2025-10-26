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

if (!POSTGRESQL_HOST) {

  throw new Error("POSTGRESQL_HOST must be defined in the environment.");

}

if (!POSTGRESQL_PORT) {

  throw new Error("POSTGRESQL_PORT must be defined in the environment.");

}

if (!POSTGRESQL_DATABASE_NAME) {

  throw new Error("POSTGRESQL_DATABASE_NAME must be defined in the environment.");

}

// Get the PostgreSQL credentials.
const { VAULT_ENDPOINT } = process.env;
if (!VAULT_ENDPOINT) {

  throw new Error("VAULT_ENDPOINT must be defined in the environment.");

}

const vault = new VaultClient({
  endpoint: VAULT_ENDPOINT
});

const initResult = await vault.init({
  secret_shares: 1, 
  secret_threshold: 1
});

if (!initResult.data) {

  throw new Error("Failed to initialize Vault.");

}

const { keys, root_token } = initResult.data;
vault.token = root_token;

const unsealed = await vault.unseal({ key: keys[0] });
if (!unsealed.data) {

  throw new Error("Failed to unseal Vault.");

}

// TODO: Fix this
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