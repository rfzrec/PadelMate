const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "padeluser",
  password: process.env.DB_PASSWORD || "padelpassword",
  database: process.env.DB_NAME || "padelmate",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  dateStrings: ["DATE"]
});

module.exports = db;
