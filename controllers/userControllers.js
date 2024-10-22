const userServices = require("../services/userServices");
// Controller đăng nhập
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userServices.login(email, password);
    res.json({
      user,
      token,
    });
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

module.exports = {
  login,
  signUp,
};
