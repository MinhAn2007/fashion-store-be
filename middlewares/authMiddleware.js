const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
console.log(req.headers);

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

module.exports = verifyToken;
