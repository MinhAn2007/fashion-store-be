// controllers/cartController.js
const cartService = require('../services/cartServices');
const fetchCartItems = async (req, res) => {
    const { customerId } = req.params;

    try {
        const { totalQuantity, cartItems } = await cartService.getCartItems(customerId);
        
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

const updateCartItemQuantity = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have user info in request
        const { productId, action } = req.body;

        if (!productId || !action) {
            return res.status(400).json({
                error: 'Product ID and action are required'
            });
        }

        if (!['increase', 'decrease'].includes(action)) {
            return res.status(400).json({
                error: 'Invalid action. Must be either increase or decrease'
            });
        }

        const result = await cartService.updateCartItemQuantity(userId, productId, action);
        res.json(result);

    } catch (error) {
        console.error('Cart update error:', error);
        res.status(500).json({
            error: error.message || 'Error updating cart item'
        });
    }
};


module.exports = {
    updateCartItemQuantity,
    fetchCartItems,
};
