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
    if (!firstName || !lastName || !email) {
      throw new Error("Thiếu thông tin bắt buộc");
    }

    const result = await knex.transaction(async (trx) => {
      // Cập nhật thông tin người dùng
      await trx("User")
        .where({ id: userId })
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email,
          updated_at: knex.fn.now(),
        });

      if (Array.isArray(addresses)) {
        // Xóa tất cả các địa chỉ hiện tại của người dùng
        await trx("Address").where({ user_id: userId }).del();

        // Thêm lại địa chỉ mới
        for (const address of addresses) {
          await trx("Address").insert({
            user_id: userId,
            address_line: address.addressLine,
            city: address.city,
            state: address.state,
            country: address.country || "Vietnam",
            postal_code: address.postalCode || "9999",
            phone_number: address.phoneNumber,
            type: address.type || "home",
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
          });
        }
      }

      // Lấy thông tin người dùng và địa chỉ sau khi cập nhật
      const user = await trx("User").where({ id: userId }).first();
      const updatedAddresses = await trx("Address").where({ user_id: userId }).select();

      return {
        user,
        addresses: updatedAddresses,
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
        id: address.id,
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
    console.error("Error in updateUser transaction:", error.message);
    throw new Error(`Cập nhật thông tin người dùng không thành công: ${error.message}`);
  }
};

const deleteAddress = async (userId, addressId) => {
  try {
    // Kiểm tra xem địa chỉ có tồn tại và thuộc về người dùng hay không
    const address = await knex("Address").where({ id: addressId, user_id: userId }).first();
    if (!address) {
      throw new Error("Địa chỉ không tồn tại hoặc không thuộc về người dùng.");
    }

    // Xóa địa chỉ
    await knex("Address").where({ id: addressId }).del();

    return {
      success: true,
      message: "Xóa địa chỉ thành công",
    };
  } catch (error) {
    console.error("Error deleting address:", error.message);
    throw new Error(`Xóa địa chỉ không thành công: ${error.message}`);
  }
};

//Admin
const getAllUsers = async ({ page, limit, search, sortBy, sortOrder }) => {
  try {
    // Kiểm tra và gán giá trị mặc định nếu không hợp lệ
    if (!Number.isInteger(page) || page < 1) {
      page = 1;
    }
    if (!Number.isInteger(limit) || limit < 1) {
      limit = 10;
    }

    const offset = (page - 1) * limit;

    // In ra để kiểm tra
    console.log(`Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Truy vấn lấy danh sách người dùng
    const usersQuery = knex('User')
      .select('id', 'first_name', 'last_name', 'email', 'created_at')
      .where(function () {
        this.where('first_name', 'like', `%${search}%`)
          .orWhere('last_name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`);
      })
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    // Truy vấn đếm tổng số người dùng
    const countQuery = knex('User')
      .count('id as count')
      .where(function () {
        this.where('first_name', 'like', `%${search}%`)
          .orWhere('last_name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`);
      })
      .first();

    // Thực hiện cả hai truy vấn song song
    const [users, countResult] = await Promise.all([usersQuery, countQuery]);

    const total = parseInt(countResult.count, 10);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error in getAllUsers:', error.message);
    throw new Error('Không thể lấy danh sách người dùng');
  }
};


const getUserStats = async () => {
  try {
    const totalUsersResult = await knex("User").count("id as count").first();
    const totalUsers = totalUsersResult ? parseInt(totalUsersResult.count, 10) : 0;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const newUsersThisMonthResult = await knex("User")
      .whereRaw("MONTH(created_at) = ? AND YEAR(created_at) = ?", [currentMonth, currentYear])
      .count("id as count")
      .first();
    const newUsersThisMonth = newUsersThisMonthResult ? parseInt(newUsersThisMonthResult.count, 10) : 0;

    const monthlyNewUsers = await knex("User")
      .select(
        knex.raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
        knex.raw("COUNT(id) as newUsers")
      )
      .whereRaw("YEAR(created_at) = ?", [currentYear])
      .groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
      .orderBy("month");

    return {
      totalUsers,
      newUsersThisMonth,
      monthlyNewUsers,
    };
  } catch (error) {
    console.error("Error in getUserStats:", error.message);
    throw new Error("Unable to fetch user statistics.");
  }
};

//admin login
const adminLogin = async (email, password) => {
  try {
    // Danh sách email được phép truy cập và mật khẩu cố định
    const allowedAdmins = [
      'voongocminhan20072002@gmail.com',
      'longsky0912624119@gmail.com'
    ];
    const commonPassword = '12345678l';

    // Kiểm tra email và mật khẩu có khớp không
    if (!allowedAdmins.includes(email) || password !== commonPassword) {
      throw new Error("Email hoặc mật khẩu không chính xác");
    }

    // Tạo token JWT sau khi xác thực thành công
    const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return {
      user: {
        email: email,
        role: 'admin',
      },
      token: token,
    };
  } catch (error) {
    console.error("Error during admin login:", error.message);
    throw error;
  }
};




module.exports = {
  login,
  signUp,
  getUserById,
  updateUser,
  deleteAddress,
  getAllUsers,
  getUserStats,
  adminLogin
};
