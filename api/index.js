const express = require("express");
const cors = require("cors");
const expressListEndpoints = require("express-list-endpoints");
const productRoutes = require("../routes/productRoutes");
const userRoutes = require("../routes/userRoutes");
const cartRoutes = require("../routes/cartRoutes");
const orderRoutes = require("../routes/orderRoutes");
const paymentRoutes = require("../routes/paymentRoutes");
const app = express();
const PORT = process.env.PORT || 4000;

require("dotenv").config();

app.use(express.json());
app.use(cors());

// Kết nối tới cơ sở dữ liệu
require("../config/database").connectDB(); // Kết nối với cơ sở dữ liệu MongoDB

app.use('/api', productRoutes); // Kết nối route vào ứng dụng
app.use('/api', userRoutes); // Kết nối route vào ứng dụng
app.use('/api', cartRoutes); // Kết nối route vào ứng dụng
app.use('/api', orderRoutes); // Kết nối route vào ứng dụng
app.use('/api', paymentRoutes); // Kết nối route vào ứng dụng

app.listen(PORT, () => {
  // Khởi tạo server và lắng nghe trên PORT được xác định
  console.log("Server Started in", PORT);
});
console.log(expressListEndpoints(app)); // In ra danh sách các endpoint mà server đang lắng nghe

module.exports = app;
