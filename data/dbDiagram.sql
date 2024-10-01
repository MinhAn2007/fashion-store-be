CREATE TABLE Category (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    parent_id INT,
    description TEXT,
    image VARCHAR(255),
    status TINYINT(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (parent_id) REFERENCES Category(id) ON DELETE SET NULL
);

-- Table for managing products



-- Table for managing users
CREATE TABLE User (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    password VARCHAR(255) NOT NULL

);
CREATE TABLE Product (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stock_quantity INT NOT NULL, -- Total available quantity
    sold INT,
    status TINYINT(1) NOT NULL,
    featured TINYINT(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES Category(id) ON DELETE SET NULL
);
-- Table for managing addresses
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

-- Table for managing orders
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
    FOREIGN KEY (customer_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES Payment(id) ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES Coupon(id) ON DELETE SET NULL
);

-- Table for managing order items
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

-- Table for managing coupons
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

-- Table for managing carts
CREATE TABLE Cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Table for managing items in carts
CREATE TABLE CartItem (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT,
    product_id INT,
    quantity INT,
    price FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES Cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
);

-- Table for managing product reviews
CREATE TABLE Review (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    customer_id INT,
    rating INT,
    title VARCHAR(255),
    content TEXT,
    is_approved BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Table for managing assets (like images)
CREATE TABLE Assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255),
    path VARCHAR(255),
    type VARCHAR(50),
    size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

-- Table for managing product assets
CREATE TABLE Product_Asset (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    asset_id INT,
    type VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES Assets(id) ON DELETE CASCADE
);

-- Table for managing attributes
CREATE TABLE Attributes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description VARCHAR(255)
);

-- Table for managing product attributes
CREATE TABLE Product_Attribute (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    attribute_id INT,
    value VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES Attributes(id) ON DELETE CASCADE
);

-- Table for managing product SKUs
CREATE TABLE products_skus (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT DEFAULT NULL,
    size_attribute_id INT DEFAULT NULL,
    color_attribute_id INT DEFAULT NULL,
    sku VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    image_id INT,  -- Column to link with images
    PRIMARY KEY (id),
    KEY product_id (product_id),
    KEY size_attribute_id (size_attribute_id),
    KEY color_attribute_id (color_attribute_id),
    CONSTRAINT FOREIGN KEY (product_id) REFERENCES Product (id) ON DELETE CASCADE,
    CONSTRAINT FOREIGN KEY (size_attribute_id) REFERENCES Product_Attribute (id) ON DELETE SET NULL,
    CONSTRAINT FOREIGN KEY (color_attribute_id) REFERENCES Product_Attribute (id) ON DELETE SET NULL,
    CONSTRAINT FOREIGN KEY (image_id) REFERENCES Assets(id) ON DELETE SET NULL  -- Liên kết với bảng Assets
);

-- Table for managing payment methods and discount rates
CREATE TABLE Payment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_method VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    discount_rate DECIMAL(10, 2) NOT NULL

);