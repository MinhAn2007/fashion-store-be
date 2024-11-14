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
const deleteAddressController = async (req, res) => {
  const userId = req.user.userId; // Lấy userId từ token đã xác thực
  const { addressId } = req.params; // Lấy addressId từ tham số URL

  try {
    const result = await userServices.deleteAddress(userId, addressId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting address:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//Admin
// userController.js

const getAllUsers = async (req, res) => {
  try {
    let {
      page = '1',
      limit = '10',
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    // Chuyển đổi sang số nguyên
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // Kiểm tra và gán giá trị mặc định nếu không hợp lệ
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (isNaN(limit) || limit < 1) {
      limit = 10;
    }

    const result = await userServices.getAllUsers({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      users: result.users,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ success: false, message: 'Không thể lấy danh sách người dùng' });
  }
};



const getUserStats = async (req, res) => {
  try {
    const stats = await userServices.getUserStats();

    res.status(200).json({
      success: true,
      totalUsers: stats.totalUsers,
      newUsersThisMonth: stats.newUsersThisMonth,
      monthlyNewUsers: stats.monthlyNewUsers,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error.message);
    res.status(500).json({ success: false, message: 'Unable to fetch user statistics' });
  }
};

//admin login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminData = await userServices.adminLogin(email, password);
    res.json(adminData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


module.exports = {
  login,
  getUserInfo,
  signUp,
  updateUserInfo,
  deleteAddressController,
  getAllUsers,
  getUserStats,
  adminLogin

};
