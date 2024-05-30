const mysql = require('mysql2/promise');
const {User, Form, Client, Lead, Discord} = require("../models");
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
    await __pool.query(Client);
    await __pool.query(Form);
    await __pool.query(Lead);
    await __pool.query(Discord);


    createUsers();
    console.log("#####  Tables Created Successfully #####") 
}



async function createUsers() {
    const [rows] = await __pool.query(`SELECT * FROM users`);
    if(rows.length == 2) {
        console.log("##### Users Already Exists #####")
        return;
    }else{
        await __pool.query(`DELETE FROM users`);

        const salt = crypto.randomBytes(16)
        const hashedPassword = crypto.pbkdf2Sync("123456", salt, 310000, 32, 'sha256');

        const [rows] = await __pool.query(`INSERT INTO users (email, hashed_password, salt, role) VALUES (?, ?, ?, ?)`, ["admin@gmail.com", hashedPassword, salt, 'admin']);
        console.log("#####  Admin User Created Successfully #####")
        
        await __pool.query(`INSERT INTO users (email, hashed_password, salt, role) VALUES (?, ?, ?, ?)`, ["user@gmail.com", hashedPassword, salt, 'user']);
        console.log("#####  User User Created Successfully #####")
    }
}


module.exports = setupDb;