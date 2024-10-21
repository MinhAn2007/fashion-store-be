const knex = require("../config/database").db;
const bcrypt = require("bcrypt");
const login = async (email, password) => {
  try {
    const user = await knex("User").where({ email }).first(); // Lấy thông tin người dùng theo email

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Kiểm tra mật khẩu
    const isMatch = (await password) === user.password;
    if (!isMatch) {
      throw new Error("Mật khẩu không chính xác");
    }

    return {
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
    }; // Trả về thông tin người dùng
  } catch (error) {
    console.error("Error during login:", error.message);
    throw error; // Ném lỗi để xử lý bên ngoài
  }
};

const signUp = async (firstName, lastName, email, password, addresses) => {
  try {
    // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm người dùng vào bảng User
    const [userId] = await knex("User")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: hashedPassword,
      })
      .returning("id"); // Trả về ID của người dùng mới được tạo

    // Nếu có địa chỉ, thêm vào bảng Address
    if (addresses && addresses.length > 0) {
      const addressEntries = addresses.map((address) => ({
        user_id: userId,
        street: address.street,
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
        country: address.country,
      }));

      await knex("Address").insert(addressEntries); // Thêm địa chỉ vào bảng Address
    }

    return { userId }; // Trả về ID người dùng
  } catch (error) {
    console.error("Error during sign up:", error.message);
    throw error; // Ném lỗi để xử lý bên ngoài
  }
};

module.exports = {
  login,
  signUp,
};
