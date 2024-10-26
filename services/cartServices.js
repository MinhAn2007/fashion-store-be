// services/cartService.js
const knex = require("../config/database").db;

const getCartItems = async (userId) => {
    try {
      // Join CartItem with Cart, Products_skus, and Product to get product name
      const cartItems = await knex("CartItem")
        .join("Cart", "CartItem.cart_id", "=", "Cart.id")
        .join("Products_skus", "CartItem.product_id", "=", "Products_skus.id")
        .join("Product", "Products_skus.product_id", "=", "Product.id")
        .select(
          "Products_skus.product_id as productId",
          "Products_skus.sku",
          "Products_skus.price as skuPrice",
          "CartItem.quantity",
          "CartItem.price as cartItemPrice",
          "Products_skus.quantity as stockQuantity",
          "Products_skus.size as size",
          "Products_skus.color as color",
          "Products_skus.image as productImage",
          "Product.name as productName",
          "CartItem.created_at"
        )
        .where("Cart.customer_id", userId);
  
      // If no items are found, return an empty array and totalQuantity as 0
      if (cartItems.length === 0) {
        return { cartItems: [], totalQuantity: 0 };
      }
  
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

const updateCartItemQuantity = async (customerId, productId, quantity) => {
    console.log("Updating cart item quantity:", customerId, productId, quantity);
  
    try {
      const cart = await knex("Cart").where("customer_id", customerId).first();
  
      if (!cart) {
        console.log("No cart found for customer:", customerId);
        return { cartItems: [], totalQuantity: 0 }; // Return an empty cart
      }
  
      const cartItem = await knex("CartItem")
        .where({
          cart_id: cart.id,
          product_id: productId,
        })
        .first();
  
      if (!cartItem) {
        console.log("Cart item not found for product:", productId);
        return { cartItems: [], totalQuantity: 0 }; // Return an empty cart
      }
  
      const productSku = await knex("Products_skus")
        .where("id", productId)
        .select("quantity as stock_quantity", "price as sku_price")
        .first();
  
      if (!productSku) {
        throw new Error("Product SKU not found");
      }
  
      if (quantity < 1) {
        await knex("CartItem")
          .where({
            cart_id: cart.id,
            product_id: productId,
          })
          .del();
  
        return await getCartItems(customerId); // Automatically return cart items
      } else if (quantity > productSku.stock_quantity) {
        throw new Error("Not enough stock");
      }
  
      await knex("CartItem")
        .where({
          cart_id: cart.id,
          product_id: productId,
        })
        .update({
          quantity: quantity,
          price: productSku.sku_price * quantity,
          updated_at: knex.fn.now(),
        });
  
      return await getCartItems(customerId);
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      throw error;
    }
  };

const removeCartItem = async (customerId, productId) => {
    try {
      const cart = await knex("Cart").where("customer_id", customerId).first();
  
      if (!cart) {
        throw new Error("Giỏ hàng không tồn tại");
      }
  
      const deletedRows = await knex("CartItem")
        .where({
          cart_id: cart.id,
          product_id: productId,
        })
        .del();
  
      if (deletedRows === 0) {
        throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
      }
  
      const { cartItems, totalQuantity } = await getCartItems(customerId);
  
      if (totalQuantity === 0) {
        return { cartItems: [], totalQuantity }; // Return an empty cart
      }
  
      return { cartItems, totalQuantity };
    } catch (error) {
      console.error("Error removing cart item:", error);
      throw error;
    }
  };

module.exports = {
  getCartItems,
  updateCartItemQuantity,
  removeCartItem,
};
