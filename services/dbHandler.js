const mysql = require('mysql2/promise');
const {User, Form} = require("../models");
const crypto = require("crypto");

async function setupDb() {
    const pool = await mysql.createPool({
        host:process.env.db_HOST,
        user: process.env.db_USER,
        database: process.env.DB,
        password:process.env.db_PASS
    });
    Object.defineProperty(global, '__pool', {
        value: pool,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    console.log("#####  MYSQL Connection Established Successfully #####")
    await createTables();
}



async function createTables() {
    await __pool.query(User);
    await __pool.query(Form);
}


module.exports = setupDb;