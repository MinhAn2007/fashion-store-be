-- Table for managing categories (if a category is deleted, its products will be updated to NULL)
CREATE TABLE Category (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    parent_id INT,
    description TEXT,
    status TINYINT(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (parent_id) REFERENCES Category(id) ON DELETE SET NULL
);

-- Table for managing users (if a user is deleted, their addresses, orders, carts, reviews will also be deleted)
CREATE TABLE User (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    password VARCHAR(255) NOT NULL
);

-- Table for managing products (if a product is deleted, related order items, cart items, reviews, stock history, and SKUs will also be deleted)
CREATE TABLE Product (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stock_quantity INT NOT NULL,
    sold INT,
    status TINYINT(1) NOT NULL,
    featured TINYINT(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES Category(id) ON DELETE SET NULL
);

-- Table for managing payment methods and discount rates (independent)
CREATE TABLE Payment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_method VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    discount_rate DECIMAL(10, 2) NOT NULL
);

-- Table for managing coupons (independent)
CREATE TABLE Coupon (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_code VARCHAR(255) UNIQUE,
    coupon_type ENUM('percent', 'fixed_amount'),
    coupon_value DECIMAL(10,2),
    coupon_start_date DATE,
    coupon_end_date DATE,
    coupon_min_spend DECIMAL(10,2),
    coupon_max_spend DECIMAL(10,2),
    coupon_uses_per_customer INT,
    coupon_uses_per_coupon INT,
    coupon_status ENUM('active', 'expired', 'disabled'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

-- Table for managing addresses (if a user is deleted, their addresses will be deleted)
CREATE TABLE Address (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    postal_code VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Table for managing orders (if a user is deleted, their orders will be deleted; if a payment or coupon is deleted, the reference is set to NULL)
CREATE TABLE `Order` (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    status ENUM('Pending Confirmation', 'In Transit', 'Delivered', 'Returned', 'Cancelled') NOT NULL,
    shipping_fee DECIMAL(18,2),
    total DECIMAL(18,2) NOT NULL,
    payment_id INT,
    coupon_id INT, -- Connection to coupon
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    canceled_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    delivery_at TIMESTAMP NULL DEFAULT NULL,
    address VARCHAR(255) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES Payment(id) ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES Coupon(id) ON DELETE SET NULL
);

-- Table for managing order items (if an order or product is deleted, related order items will be deleted)
CREATE TABLE OrderItem (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    name VARCHAR(255),
    quantity INT,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES `Order`(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
);

-- Table for managing carts (if a user is deleted, their cart will be deleted)
CREATE TABLE Cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Table for managing items in carts (if a cart or product is deleted, related cart items will be deleted)
CREATE TABLE CartItem (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT,
    product_sku_id INT,
    quantity INT,
    price FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES Cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_sku_id) REFERENCES Products_skus(id) ON DELETE CASCADE
);

-- Table for managing product reviews (if a product or user is deleted, related reviews will be deleted)
CREATE TABLE Review (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    customer_id INT,
    rating INT,
    title VARCHAR(255),
    content TEXT,
    is_approved BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    images JSON,
    video JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Table for managing product SKUs (if a product is deleted, related SKUs will be deleted)
CREATE TABLE Products_skus (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT DEFAULT NULL,
    size_attribute_id VARCHAR(255) DEFAULT 'M',
    color_attribute_id VARCHAR(255) DEFAULT "Màu đỏ",
    sku VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    image VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY product_id (product_id),
    KEY size_attribute_id (size_attribute_id),
    KEY color_attribute_id (color_attribute_id),
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
);

-- Table for managing stock history (if a product is deleted, related stock history entries will be deleted)
CREATE TABLE Stock_History (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    arrival_time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY product_id (product_id),
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
);
ADD FOREIGN KEY (product_id) REFERENCES Products_skus(id) ON DELETE CASCADE;
