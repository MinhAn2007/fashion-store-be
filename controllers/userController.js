const { getAllUsers } = require('../services/userService');

// Xử lý yêu cầu GET tất cả người dùng
const getAllUsersHandler = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Không thể lấy danh sách người dùng.' });
  }
};

module.exports = {
  getAllUsersHandler,
};
