// config/database.js
const { Sequelize } = require('sequelize');
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

// Đọc tệp CA certificate
const caCert = fs.readFileSync("ca.pem");

// Tạo pool kết nối MySQL có SSL
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 21588,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    ssl: {
      ca: caCert,
    },
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Đã kết nối tới MySQL bằng Sequelize");
  } catch (err) {
    console.error("Lỗi kết nối MySQL:", err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
