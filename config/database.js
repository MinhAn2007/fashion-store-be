const knex = require('knex');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Đọc tệp CA certificate (nếu cần cho SSL)
const caCert = fs.existsSync('ca.pem') ? fs.readFileSync('ca.pem') : null;

// Tạo pool kết nối MySQL có SSL
const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true', // Có thể bỏ qua chứng thực nếu cần
      ca: caCert // Thêm chứng chỉ CA nếu có
    },
  },
  pool: {
    min: 0,
    max: 10,
  },
});

// Thay đổi chế độ SQL
const setSqlMode = async () => {
  try {
    await db.raw("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
    console.log('Chế độ SQL đã được thay đổi');
  } catch (err) {
    console.error('Lỗi khi thay đổi chế độ SQL:', err.message);
  }
};

// Kiểm tra kết nối
const connectDB = async () => {
  try {
    await setSqlMode(); // Thay đổi chế độ SQL trước khi kiểm tra kết nối
    await db.raw('SELECT 1+1 AS result');
    console.log('Đã kết nối tới MySQL bằng Knex.js');
  } catch (err) {
    console.error('Lỗi kết nối MySQL:', err.message);
    process.exit(1);
  }
};

module.exports = { db, connectDB };
