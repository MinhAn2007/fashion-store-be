const User = require('../models/userModel');

const getAllUsers = async () => {
  try {
    const users = await User.findAll();
    return users;
  } catch (err) {
    console.error('Lỗi khi lấy danh sách người dùng:', err.message);
    throw new Error('Không thể lấy danh sách người dùng.');
  }
};

module.exports = {
  getAllUsers,
};
