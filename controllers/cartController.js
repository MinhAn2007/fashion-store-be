// controllers/cartController.js
const { getCartItems } = require('../services/cartServices');

const fetchCartItems = async (req, res) => {
    const { customerId } = req.params;

    try {
        const { totalQuantity, cartItems } = await getCartItems(customerId);
        
        // Trả về kết quả
        res.status(200).json({
            totalQuantity,
            cartItems,
        });
    } catch (error) {
        console.error('Error fetching cart data:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy dữ liệu giỏ hàng.' });
    }
};

module.exports = {
    fetchCartItems,
};
