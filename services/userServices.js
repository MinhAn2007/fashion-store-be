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

    // Tạo JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Lấy số lượng sản phẩm trong giỏ hàng của người dùng
    const cartQuantityResult = await knex("CartItem")
      .join("Cart", "CartItem.cart_id", "=", "Cart.id")
      .where("Cart.customer_id", user.id)
      .sum("CartItem.quantity as totalQuantity");

    const totalCartQuantity = cartQuantityResult[0].totalQuantity || 0;

    return {
      user: {
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        totalCartQuantity, // Trả về số lượng sản phẩm trong giỏ hàng
      },
      token: token,
    };
  } catch (error) {
    console.error("Error during login:", error.message);
    throw error;
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
        type: address.type ? address.type : "Home",
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

const getUserById = async (userId) => {
  try {
    // Lấy thông tin người dùng theo ID
    const user = await knex("User").where({ id: userId }).first();

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Lấy danh sách địa chỉ của người dùng
    const addresses = await knex("Address").where({ user_id: userId });

    return {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
      addresses: addresses.map(address => ({
        addressLine: address.address_line,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postal_code,
        phoneNumber: address.phone_number,
        type: address.type,
      })),
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateUser = async (userId, { firstName, lastName, email, addresses }) => {
  try {
    // Validate input data
    if (!firstName || !lastName || !email) {
      throw new Error("Thiếu thông tin bắt buộc");
    }

    // Start transaction
    const result = await knex.transaction(async (trx) => {
      // 1. Cập nhật thông tin cơ bản của người dùng
      await trx("User")
        .where({ id: userId })
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email,
          updated_at: knex.fn.now() // Cập nhật thời gian sửa đổi
        });

      // 2. Xử lý địa chỉ
      if (Array.isArray(addresses)) {
        // Xóa tất cả địa chỉ cũ
        await trx("Address").where({ user_id: userId }).del();

        // Thêm địa chỉ mới nếu có
        if (addresses.length > 0) {
          const addressEntries = addresses.map((address) => ({
            user_id: userId,
            address_line: address.addressLine,
            city: address.city,
            state: address.state,
            country: address.country,
            postal_code: address.postalCode,
            phone_number: address.phoneNumber,
            type: address.type || "home",
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          }));

          await trx("Address").insert(addressEntries);
        }
      }

      // 3. Lấy thông tin người dùng đã cập nhật
      const user = await trx("User")
        .where({ id: userId })
        .first();

      const updatedAddresses = await trx("Address")
        .where({ user_id: userId })
        .select();

      return {
        user,
        addresses: updatedAddresses
      };
    });

    return {
      user: {
        id: result.user.id,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        email: result.user.email,
      },
      addresses: result.addresses.map(address => ({
        addressLine: address.address_line,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postal_code,
        phoneNumber: address.phone_number,
        type: address.type,
      })),
    };

  } catch (error) {
    throw new Error(`Cập nhật thông tin người dùng không thành công: ${error.message}`);
  }
};
module.exports = {
  login,
  signUp,
  getUserById,
  updateUser
};
