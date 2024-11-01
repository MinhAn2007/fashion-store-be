const userServices = require("../services/userServices");

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
  const userId = req.user.userId; // Lấy userId từ token đã xác thực
  const { firstName, lastName, email, addresses } = req.body;

  try {
    const updatedUser = await userServices.updateUser(userId, {
      firstName,
      lastName,
      email,
      addresses,
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
///

module.exports = {
  login,
  getUserInfo,
  signUp,
  ///
  updateUserInfo
  ///
};
