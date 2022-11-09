import { Knex, knex } from "knex";
import {
  DB_SQL_CLIENT,
  DB_SQL_HOST,
  DB_SQL_NAME,
  DB_SQL_PASSWORD,
  DB_SQL_PORT,
  DB_SQL_USER,
} from "../utils/environment";

export interface User {
  id: number;
  username: string;
  name: string;
  is_admin: boolean;
  is_notifications: boolean;
}
export interface History {
  user_id: number;
  reason: string;
  date: Date;
}

const config: Knex.Config = {
  client: DB_SQL_CLIENT,
  connection: {
    host: DB_SQL_HOST,
    user: DB_SQL_USER,
    password: DB_SQL_PASSWORD,
    database: DB_SQL_NAME,
    port: Number(DB_SQL_PORT),
  },
};

const knexInstance = knex(config);

export async function getUser(id: number): Promise<User> {
  const result = await knexInstance<User>("users")
    .select("*")
    .where("id", "=", id)
    .limit(1);
  return result[0];
}

export async function getAdmins(): Promise<User[]> {
  let result: User[];
  try {
    console.log("trying to get admins");
    result = await knexInstance<User>("users")
      .select("*")
      .where("is_admin", "=", true)
      .andWhere("is_notifications", "=", true);
  } catch (e) {
    console.log(
      "got error while getting admins with error\n",
      JSON.stringify(e)
    );
    throw e;
  }

  return result;
}

export async function upsertUser(upsertData: {
  id: number;
  username?: string;
  name?: string;
  isAdmin?: boolean;
  isNotifications?: boolean;
}): Promise<User> {
  console.log(
    `Got upsert request with payload: \n[${JSON.stringify(upsertData)}]`
  );
  try {
    const user = await knexInstance<User>("users")
      .insert({
        id: upsertData.id,
        username: upsertData.username,
        name: upsertData.name,
        is_admin: upsertData.isAdmin,
        is_notifications: upsertData.isNotifications,
      })
      .onConflict("id")
      .merge(["name", "is_notifications", "is_admin"])
      .returning("*");

    return user[0];
  } catch (e) {
    throw new Error(`Got new error while upserting: \n${e}`);
  }
}

export async function getHistory(): Promise<History[]> {
  let result: History[];
  try {
    console.log("trying to get history");
    result = await knexInstance<History>("history")
      .select("users.username", "users.name", "history.*")
      .leftJoin("users", function () {
        this.on("users.id", "=", "history.user_id");
      })
      .where("history.date", ">", "2022-01-01");
  } catch (e) {
    console.log(
      "got error while getting history with error\n",
      JSON.stringify(e)
    );
    throw e;
  }

  return result;
}

export async function insertHistory(historyData: History): Promise<History> {
  console.log(
    `Got insert "history" request with payload: \n[${JSON.stringify(
      historyData
    )}]`
  );
  try {
    const historyRecord = await knexInstance<History>("history")
      .insert(historyData)
      .returning("*");

    return historyRecord[0];
  } catch (e) {
    throw new Error(`Got new error while upserting: \n${e}`);
  }
}
