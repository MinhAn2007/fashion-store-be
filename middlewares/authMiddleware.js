const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ message: "Token không được cung cấp" });
  }
  const actualToken = token.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin người dùng vào req để sử dụng sau
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    const allowedAdmins = [
      'voongocminhan20072002@gmail.com',
      'longsky0912624119@gmail.com'
    ];

    if (!req.user || (req.user.role !== 'admin' && !allowedAdmins.includes(req.user.email))) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  });
};
module.exports = { verifyToken, verifyAdmin };
