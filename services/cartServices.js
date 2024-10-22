// services/cartService.js
const knex = require("../config/database").db;

const getCartItems = async (userId) => {
    try {
        // Join CartItem with Cart and Products_skus (instead of Product)
        const cartItems = await knex('CartItem')
          .join('Cart', 'CartItem.cart_id', '=', 'Cart.id')
          .join('Products_skus', 'CartItem.product_id', '=', 'Products_skus.id')
          .select(
            'Products_skus.product_id as productId', // Get the actual product ID from Products_skus
            'Products_skus.sku',
            'Products_skus.price as skuPrice',
            'CartItem.quantity',
            'CartItem.price as cartItemPrice',
            'Products_skus.quantity as stockQuantity',
            'Products_skus.size as size',
            'Products_skus.color as color',
            'Products_skus.image as productImage',
            'CartItem.created_at'
          )
          .where('Cart.customer_id', userId);

        // Calculate total quantity in cart
        const totalQuantityResult = await knex('CartItem')
          .join('Cart', 'CartItem.cart_id', '=', 'Cart.id')
          .where('Cart.customer_id', userId)
          .sum('CartItem.quantity as totalQuantity');

        const totalQuantity = totalQuantityResult[0].totalQuantity || 0;

        return { cartItems, totalQuantity };
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching cart items');
    }
};

module.exports = {
    getCartItems,
};
