const knex = require("../config/database").db;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (email, password) => {
  try {
    const user = await knex("User").where({ email }).first(); // Lấy thông tin người dùng theo email

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Mật khẩu không chính xác");
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return {
      user: {
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
    }; // Trả về thông tin người dùng
  } catch (error) {
    console.error("Error during login:", error.message);
    throw error; // Ném lỗi để xử lý bên ngoài
  }
};

const signUp = async (firstName, lastName, email, password, addresses) => {
  try {
    const existingUser = await knex("User").where({ email }).first();
    if (existingUser) {
      throw new Error("Email đã được sử dụng");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userId] = await knex("User")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: hashedPassword,
      })
      .returning("id");

    if (addresses && addresses.length > 0) {
      const addressEntries = addresses.map((address) => ({
        user_id: userId,
        address_line: address.addressLine,
        city: address.city,
        state: address.state,
        country: 'Vietnam',
        postal_code: '9999',
        phone_number: address.phoneNumber,
      }));

      await knex("Address").insert(addressEntries);
    }

    const loginResponse = await login(email, password);
    return { userId, loginResponse };
  } catch (error) {
    console.error("Error during sign up:", error.message);
    throw error;
  }
};

module.exports = {
  login,
  signUp,
};
