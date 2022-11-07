import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env") });

const checkEnvironmentFor = (variable: string) => {
  if (process.env[variable]) return process.env[variable] || '';
  throw `MISSING ${variable} VARIABLE IN PROCESS ENVIRONMENT`;
};

export const TELEGRAM_BOT_TOKEN = checkEnvironmentFor("TELEGRAM_BOT_TOKEN");
export const PORT = checkEnvironmentFor("PORT");
export const DB_SQL_CLIENT = checkEnvironmentFor("DB_SQL_CLIENT");
export const DB_SQL_HOST = checkEnvironmentFor("DB_SQL_HOST");
export const DB_SQL_USER = checkEnvironmentFor("DB_SQL_USER");
export const DB_SQL_NAME = checkEnvironmentFor("DB_SQL_NAME");
export const DB_SQL_PASSWORD = checkEnvironmentFor("DB_SQL_PASSWORD");
export const DB_SQL_PORT = checkEnvironmentFor("DB_SQL_PORT");