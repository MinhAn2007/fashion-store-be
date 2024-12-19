const express = require("express");
const http = require("http");
const cors = require("cors");
const expressListEndpoints = require("express-list-endpoints");
const productRoutes = require("../routes/productRoutes");
const userRoutes = require("../routes/userRoutes");
const cartRoutes = require("../routes/cartRoutes");
const orderRoutes = require("../routes/orderRoutes");
const paymentRoutes = require("../routes/paymentRoutes");
const reviewRoutes = require("../routes/reviewRoutes");
const categoryRoutes = require("../routes/categoryRoutes");
const reneuveRoutes = require("../routes/ReneuveRoutes");
const voucherRoutes = require("../routes/voucherRoutes");
const initSocket = require("../utils/socketConfig");
const { setSocketIO } = require("../utils/socket");

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

const { io } = initSocket(server);
require("dotenv").config();

app.use(express.json());
app.use(cors());
setSocketIO(io);
// Kết nối tới cơ sở dữ liệu
require("../config/database").connectDB(); // Kết nối với cơ sở dữ liệu MongoDB

app.use("/api", productRoutes); // Kết nối route vào ứng dụng
app.use("/api", userRoutes); // Kết nối route vào ứng dụng
app.use("/api", cartRoutes); // Kết nối route vào ứng dụng
app.use("/api", orderRoutes); // Kết nối route vào ứng dụng
app.use("/api", paymentRoutes); // Kết nối route vào ứng dụng
app.use("/api", reviewRoutes); // Kết nối route vào ứng dụng
app.use("/api", categoryRoutes); // Kết nối route vào ứng dụng
app.use("/api", reneuveRoutes); // Kết nối route vào ứng dụng
app.use("/api", voucherRoutes); // Kết nối route vào ứng dụng

server.listen(PORT, () => {
  // Khởi tạo server và lắng nghe trên PORT được xác định
  console.log("Server Started in", PORT);
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

app.on("listening", () => {
  console.log("Server is listening on port", PORT);
});

console.log(expressListEndpoints(app)); // In ra danh sách các endpoint mà server đang lắng nghe

module.exports = app;
