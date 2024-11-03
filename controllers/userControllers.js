const userServices = require("../services/userServices");
const knex = require("../config/database").db;

// Controller đăng nhập
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userServices.login(email, password);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller đăng ký
const signUp = async (req, res) => {
  const { firstName, lastName, email, password, addresses } = req.body;

  try {
    const user = await userServices.signUp(
      firstName,
      lastName,
      email,
      password,
      addresses
    );
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getUserInfo = async (req, res) => {
  const userId = req.params.id;

  try {
    const userInfo = await userServices.getUserById(userId);

    // Trả về kết quả
    res.status(200).json(userInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//
//Controller chỉnh sửa thông tin
const updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.userId; // Lấy userId từ token đã xác thực
    const { firstName, lastName, email, addresses } = req.body;

    // Kiểm tra email đã tồn tại (trừ email hiện tại của user)
    const existingUser = await knex("User")
      .where({ email })
      .whereNot({ id: userId })
      .first();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã được sử dụng bởi tài khoản khác"
      });
    }

    const result = await userServices.updateUser(userId, {
      firstName,
      lastName,
      email,
      addresses
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: result
    });

  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Có lỗi xảy ra khi cập nhật thông tin người dùng"
    });
  }
};

module.exports = {
  login,
  getUserInfo,
  signUp,
  updateUserInfo
};
