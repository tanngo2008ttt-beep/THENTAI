const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "ngothuctan",
  database: "thentai",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("Đã kết nối MySQL");

module.exports = db;
