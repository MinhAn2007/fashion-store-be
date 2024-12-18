// utils/ablyConfig.js
const Ably = require('ably');

const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY }); // Đảm bảo bạn đã cấu hình ABLY_API_KEY trong .env

module.exports = ably;
