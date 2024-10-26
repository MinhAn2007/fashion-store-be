// services/cartService.js
const knex = require("../config/database").db;

const getCartItems = async (userId) => {
  try {
    const cartItems = await knex("CartItem")
      .join("Cart", "CartItem.cart_id", "=", "Cart.id")
      .join("Products_skus", "CartItem.product_sku_id", "=", "Products_skus.id")
      .join("Product", "Products_skus.product_id", "=", "Product.id")
      .select(
        "Products_skus.id as id",
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

    if (cartItems.length === 0) {
      return { cartItems: [], totalQuantity: 0 };
    }

    const totalQuantityResult = await knex("CartItem")
      .join("Cart", "CartItem.cart_id", "=", "Cart.id")
      .where("Cart.customer_id", userId);

    const totalQuantity = totalQuantityResult.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

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
      return { cartItems: [], totalQuantity: 0 };
    }

    const cartItem = await knex("CartItem")
      .where({
        cart_id: cart.id,
        product_sku_id: productId,
      })
      .first();

    if (!cartItem) {
      console.log("Cart item not found for product:", productId);
      return { cartItems: [], totalQuantity: 0 };
    }

    const sku = await knex("Products_skus")
      .where("id", productId)
      .select("quantity as stock_quantity", "price as sku_price")
      .first();

    if (!sku) {
      throw new Error("SKU not found");
    }

    // Tính toán số lượng mới
    const newQuantity = quantity;

    if (newQuantity < 1) {
      await knex("CartItem")
        .where({
          cart_id: cart.id,
          product_sku_id: productId,
        })
        .del();

      // Cập nhật lại số lượng SKU nếu đã xóa sản phẩm
      await knex("Products_skus")
        .where("id", productId)
        .increment("quantity", cartItem.quantity); // Thêm lại số lượng cũ vào kho

      return await getCartItems(customerId);
    } else if (newQuantity > sku.stock_quantity + cartItem.quantity) {
      throw new Error("Not enough stock");
    }

    // Tính toán số lượng thay đổi
    const quantityDifference = newQuantity - cartItem.quantity;

    // Cập nhật giỏ hàng
    await knex("CartItem")
      .where({
        cart_id: cart.id,
        product_sku_id: productId,
      })
      .update({
        quantity: newQuantity,
        price: sku.sku_price * newQuantity,
        updated_at: knex.fn.now(),
      });

    // Cập nhật số lượng SKU trong kho
    await knex("Products_skus")
      .where("id", productId)
      .decrement("quantity", quantityDifference); // Trừ số lượng khác biệt

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
  
      const cartItem = await knex("CartItem")
        .where({
          cart_id: cart.id,
          product_sku_id: productId,
        })
        .first();
  
      if (!cartItem) {
        throw new Error("Product không tồn tại trong giỏ hàng");
      }
  
      // Hoàn trả số lượng SKU vào kho
      await knex("Products_skus")
        .where("id", productId)
        .increment("quantity", cartItem.quantity); // Thêm số lượng đã xóa
  
      const deletedRows = await knex("CartItem")
        .where({
          cart_id: cart.id,
          product_sku_id: productId,
        })
        .del();
  
      const { cartItems, totalQuantity } = await getCartItems(customerId);
  
      return { cartItems, totalQuantity };
    } catch (error) {
      console.error("Error removing cart item:", error);
      throw error;
    }
  };
  

const addItemToCart = async (customerId, productId, quantity) => {
  try {
    return await knex.transaction(async (trx) => {
      let cart = await trx("Cart").where("customer_id", customerId).first();

      if (!cart) {
        [cart] = await trx("Cart")
          .insert({ customer_id: customerId })
          .returning("*");
      }

      const sku = await trx("Products_skus").where({ id: productId }).first();

      if (!sku) {
        throw new Error("SKU không tồn tại");
      }

      if (sku.quantity < quantity) {
        throw new Error("Số lượng SKU trong kho không đủ");
      }

      const existingItem = await trx("CartItem")
        .where({
          cart_id: cart.id,
          product_sku_id: productId,
        })
        .first();

      if (existingItem) {
        await trx("CartItem")
          .where({
            cart_id: cart.id,
            product_sku_id: productId,
          })
          .update({
            quantity: existingItem.quantity + quantity,
            price: sku.price * (existingItem.quantity + quantity),
          });

        await trx("Products_skus")
          .where("id", productId)
          .decrement("quantity", quantity);
      } else {
        await trx("CartItem").insert({
          cart_id: cart.id,
          product_sku_id: productId,
          quantity: quantity,
          price: sku.price * quantity,
        });
        await trx("Products_skus")
          .where("id", productId)
          .decrement("quantity", quantity);
      }

      const updatedCartItems = await trx("CartItem")
        .join("Cart", "CartItem.cart_id", "=", "Cart.id")
        .join(
          "Products_skus",
          "CartItem.product_sku_id",
          "=",
          "Products_skus.id"
        )
        .select(
          "Products_skus.product_id as productId",
          "Products_skus.sku",
          "Products_skus.price as skuPrice",
          "CartItem.quantity",
          "CartItem.price as cartItemPrice",
          "Products_skus.quantity as stockQuantity",
          "Products_skus.size as size",
          "Products_skus.color as color",
          "Products_skus.image as skuImage",
          "CartItem.created_at"
        )
        .where("Cart.customer_id", customerId);

      const totalQuantity = updatedCartItems.reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      return { cartItems: updatedCartItems, totalQuantity };
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    throw error;
  }
};

module.exports = {
  getCartItems,
  updateCartItemQuantity,
  removeCartItem,
  addItemToCart,
};
