require("dotenv").config();
import mysql, { PoolOptions } from "mysql2";
import { Pool } from "mysql2/typings/mysql/lib/Pool";
export let pool: Pool;

export const connectDatabase = async () => {
  try {
    const access: PoolOptions = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 10,
    };
    pool = mysql.createPool(access);

    return pool;
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDatabase, 5000);
  }
};
