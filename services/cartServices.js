// services/cartService.js
const knex = require("../config/database").db;

const getCartItems = async (userId) => {
  try {
    // Join CartItem with Cart, Products_skus, and Product to get product name
    const cartItems = await knex("CartItem")
      .join("Cart", "CartItem.cart_id", "=", "Cart.id")
      .join("Products_skus", "CartItem.product_id", "=", "Products_skus.id")
      .join("Product", "Products_skus.product_id", "=", "Product.id") // Join with Product to get the product name
      .select(
        "Products_skus.product_id as productId", // Get the actual product ID from Products_skus
        "Products_skus.sku",
        "Products_skus.price as skuPrice",
        "CartItem.quantity",
        "CartItem.price as cartItemPrice",
        "Products_skus.quantity as stockQuantity",
        "Products_skus.size as size",
        "Products_skus.color as color",
        "Products_skus.image as productImage",
        "Product.name as productName", // Get the product name
        "CartItem.created_at"
      )
      .where("Cart.customer_id", userId);

    // Calculate total quantity in cart
    const totalQuantityResult = await knex("CartItem")
      .join("Cart", "CartItem.cart_id", "=", "Cart.id")
      .where("Cart.customer_id", userId)
      .sum("CartItem.quantity as totalQuantity");

    const totalQuantity = totalQuantityResult[0].totalQuantity || 0;

    return { cartItems, totalQuantity };
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching cart items");
  }
};

const updateCartItemQuantity = async (customerId, productId, action) => {
  try {
      // First get the cart id for this customer
      const cart = await knex('Cart')
          .where('customer_id', customerId)
          .first();

      if (!cart) {
          throw new Error('Cart not found');
      }

      // Get the current cart item and product SKU details
      const cartItem = await knex('CartItem')
          .join('Cart', 'CartItem.cart_id', '=', 'Cart.id')
          .join('Products_skus', 'CartItem.product_id', '=', 'Products_skus.id')
          .where({
              'Cart.customer_id': customerId,
              'CartItem.product_id': productId
          })
          .select(
              'CartItem.*',
              'Products_skus.quantity as stock_quantity',
              'Products_skus.price as sku_price'
          )
          .first();

      if (!cartItem) {
          throw new Error('Cart item not found');
      }

      let newQuantity;
      if (action === 'increase') {
          // Check if we have enough stock
          if (cartItem.quantity >= cartItem.stock_quantity) {
              throw new Error('Not enough stock');
          }
          newQuantity = cartItem.quantity + 1;
      } else if (action === 'decrease') {
          if (cartItem.quantity <= 1) {
              // If quantity would go to 0, remove the item
              await knex('CartItem')
                  .where({
                      'cart_id': cart.id,
                      'product_id': productId
                  })
                  .del();
              
              // Return updated cart items after deletion
              const updatedCart = await getCartItems(customerId);
              return updatedCart;
          }
          newQuantity = cartItem.quantity - 1;
      } else {
          throw new Error('Invalid action');
      }

      // Update the quantity and price
      await knex('CartItem')
          .where({
              'cart_id': cart.id,
              'product_id': productId
          })
          .update({
              quantity: newQuantity,
              price: cartItem.sku_price * newQuantity,
              updated_at: knex.fn.now()
          });

      // Return updated cart items
      return await getCartItems(customerId);

  } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
  }
};

module.exports = {
  getCartItems,
  updateCartItemQuantity
};
