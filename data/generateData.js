const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const { faker } = require('@faker-js/faker');

// Helper functions to generate dummy data
function generateCategories(num) {
    const categories = [];
    for (let i = 0; i < num; i++) {
        categories.push({
            id: i + 1,
            name: `Category ${i + 1}`,
            parent_id: i > 0 ? Math.floor(Math.random() * i) + 1 : null,
            description: `This is the description for Category ${i + 1}`,
            image: `image_${i + 1}.jpg`,
            status: Math.round(Math.random()),
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            deleted_at: null
        });
    }
    return categories;
}

function generateProducts(num, categoryCount) {
    const products = [];
    for (let i = 0; i < num; i++) {
        products.push({
            id: i + 1,
            category_id: Math.floor(Math.random() * categoryCount) + 1,
            name: `Product ${i + 1}`,
            description: `This is the description for Product ${i + 1}`,
            stock_quantity: Math.floor(Math.random() * 100) + 1,
            sold: Math.floor(Math.random() * 50),
            status: Math.round(Math.random()),
            featured: Math.round(Math.random()),
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            deleted_at: null
        });
    }
    return products;
}

function generateUsers(num) {
    const users = [];
    for (let i = 0; i < num; i++) {
        users.push({
            id: i + 1,
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            email: faker.internet.email(),
            password: 'password123',
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        });
    }
    return users;
}

function generateAddresses(num, userCount) {
    const addresses = [];
    for (let i = 0; i < num; i++) {
        addresses.push({
            id: i + 1,
            user_id: Math.floor(Math.random() * userCount) + 1,
            address_line: `${Math.floor(Math.random() * 100) + 1} Main St`,
            city: faker.location.city(),
            state: faker.location.state(),
            country: 'Vietnam',
            postal_code: `${Math.floor(Math.random() * 900000) + 100000}`,
            phone_number: `090${Math.floor(Math.random() * 10000000) + 1000000}`,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        });
    }
    return addresses;
}

function generateOrders(num, userCount) {
    const orders = [];
    const statuses = ['Pending Confirmation', 'In Transit', 'Delivered', 'Returned', 'Cancelled'];
    for (let i = 0; i < num; i++) {
        orders.push({
            id: i + 1,
            customer_id: Math.floor(Math.random() * userCount) + 1,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            shipping_fee: (Math.random() * (15 - 5) + 5).toFixed(2),
            total: (Math.random() * (200 - 50) + 50).toFixed(2),
            payment_id: Math.floor(Math.random() * 5) + 1,
            coupon_id: Math.random() < 0.5 ? null : Math.floor(Math.random() * 10) + 1,
            created_at: new Date().toISOString().split('T')[0],
            canceled_at: null,
            completed_at: null,
            delivery_at: null
        });
    }
    return orders;
}

function generateOrderItems(num, orderCount, productCount) {
    const orderItems = [];
    for (let i = 0; i < num; i++) {
        orderItems.push({
            id: i + 1,
            order_id: Math.floor(Math.random() * orderCount) + 1,
            product_id: Math.floor(Math.random() * productCount) + 1,
            name: `Product ${Math.floor(Math.random() * productCount) + 1}`,
            quantity: Math.floor(Math.random() * 5) + 1,
            price: (Math.random() * (50 - 10) + 10).toFixed(2),
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            deleted_at: null
        });
    }
    return orderItems;
}

function generateCoupons(num) {
    const coupons = [];
    for (let i = 0; i < num; i++) {
        coupons.push({
            id: i + 1,
            coupon_code: `COUPON${i + 1}`,
            coupon_type: Math.random() < 0.5 ? 'percent' : 'fixed_amount',
            coupon_value: (Math.random() * (50 - 5) + 5).toFixed(2),
            coupon_start_date: new Date().toISOString().split('T')[0],
            coupon_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            coupon_min_spend: (Math.random() * (100 - 10) + 10).toFixed(2),
            coupon_max_spend: (Math.random() * (200 - 50) + 50).toFixed(2),
            coupon_uses_per_customer: Math.floor(Math.random() * 5) + 1,
            coupon_uses_per_coupon: Math.floor(Math.random() * 100) + 1,
            coupon_status: ['active', 'expired', 'disabled'][Math.floor(Math.random() * 3)],
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            deleted_at: null
        });
    }
    return coupons;
}

function generateCarts(num, userCount) {
    const carts = [];
    for (let i = 0; i < num; i++) {
        carts.push({
            id: i + 1,
            customer_id: Math.floor(Math.random() * userCount) + 1,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        });
    }
    return carts;
}

function generateCartItems(num, cartCount, productCount) {
    const cartItems = [];
    for (let i = 0; i < num; i++) {
        cartItems.push({
            id: i + 1,
            cart_id: Math.floor(Math.random() * cartCount) + 1,
            product_id: Math.floor(Math.random() * productCount) + 1,
            quantity: Math.floor(Math.random() * 5) + 1,
            price: (Math.random() * (50 - 10) + 10).toFixed(2),
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        });
    }
    return cartItems;
}

function generateReviews(num, productCount, userCount) {
    const reviews = [];
    for (let i = 0; i < num; i++) {
        reviews.push({
            id: i + 1,
            product_id: Math.floor(Math.random() * productCount) + 1,
            customer_id: Math.floor(Math.random() * userCount) + 1,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Review Title ${i + 1}`,
            content: `This is the content of review ${i + 1}`,
            is_approved: Math.random() < 0.5,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        });
    }
    return reviews;
}

function generateAssets(num) {
    const assets = [];
    for (let i = 0; i < num; i++) {
        assets.push({
            id: i + 1,
            filename: `file_${i + 1}.jpg`,
            path: `/assets/${i + 1}.jpg`,
            type: 'image/jpeg',
            size: Math.floor(Math.random() * (5000 - 1000)) + 1000,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            deleted_at: null
        });
    }
    return assets;
}

function generateProductAssets(num, productCount, assetCount) {
    const productAssets = [];
    for (let i = 0; i < num; i++) {
        productAssets.push({
            id: i + 1,
            product_id: Math.floor(Math.random() * productCount) + 1,
            asset_id: Math.floor(Math.random() * assetCount) + 1,
            type: 'image',
        });
    }
    return productAssets;
}

function generateAttributes(num) {
    const attributes = [];
    for (let i = 0; i < num; i++) {
        attributes.push({
            id: i + 1,
            name: `Attribute ${i + 1}`,
            description: `This is the description for Attribute ${i + 1}`
        });
    }
    return attributes;
}

function generateProductAttributes(num, productCount, attributeCount) {
    const productAttributes = [];
    for (let i = 0; i < num; i++) {
        productAttributes.push({
            id: i + 1,
            product_id: Math.floor(Math.random() * productCount) + 1,
            attribute_id: Math.floor(Math.random() * attributeCount) + 1,
            value: `Value ${Math.floor(Math.random() * 100) + 1}`
        });
    }
    return productAttributes;
}

function generateProductSkus(num, productCount) {
    const productSkus = [];
    for (let i = 0; i < num; i++) {
        productSkus.push({
            id: i + 1,
            product_id: Math.floor(Math.random() * productCount) + 1,
            size_attribute_id: Math.floor(Math.random() * 10) + 1,
            color_attribute_id: Math.floor(Math.random() * 10) + 1,
            sku: `SKU-${i + 1}`,
            price: (Math.random() * (100 - 10) + 10).toFixed(2),
            quantity: Math.floor(Math.random() * 50) + 1,
            created_at: new Date().toISOString().split('T')[0],
            deleted_at: null
        });
    }
    return productSkus;
}

function generatePayments(num) {
    const payments = [];
    for (let i = 0; i < num; i++) {
        payments.push({
            id: i + 1,
            payment_method: `Payment Method ${i + 1}`,
            discount_rate: (Math.random() * 20).toFixed(2),
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        });
    }
    return payments;
}

// Function to write data to CSV
function writeToCSV(fileName, data) {
    const csvWriter = createObjectCsvWriter({
        path: fileName,
        header: Object.keys(data[0]).map(key => ({ id: key, title: key }))
    });

    csvWriter.writeRecords(data)
        .then(() => {
            console.log(`${fileName} written successfully.`);
        });
}

// Main function to generate data and write to CSV
function generateData() {
    const categories = generateCategories(10);
    const products = generateProducts(50, categories.length);
    const users = generateUsers(20);
    const addresses = generateAddresses(30, users.length);
    const orders = generateOrders(25, users.length);
    const orderItems = generateOrderItems(100, orders.length, products.length);
    const coupons = generateCoupons(10);
    const carts = generateCarts(15, users.length);
    const cartItems = generateCartItems(50, carts.length, products.length);
    const reviews = generateReviews(30, products.length, users.length);
    const assets = generateAssets(20);
    const productAssets = generateProductAssets(40, products.length, assets.length);
    const attributes = generateAttributes(10);
    const productAttributes = generateProductAttributes(30, products.length, attributes.length);
    const productSkus = generateProductSkus(50, products.length);
    const payments = generatePayments(5);

    // Write data to CSV files
    writeToCSV('categories.csv', categories);
    writeToCSV('products.csv', products);
    writeToCSV('users.csv', users);
    writeToCSV('addresses.csv', addresses);
    writeToCSV('orders.csv', orders);
    writeToCSV('order_items.csv', orderItems);
    writeToCSV('coupons.csv', coupons);
    writeToCSV('carts.csv', carts);
    writeToCSV('cart_items.csv', cartItems);
    writeToCSV('reviews.csv', reviews);
    writeToCSV('assets.csv', assets);
    writeToCSV('product_assets.csv', productAssets);
    writeToCSV('attributes.csv', attributes);
    writeToCSV('product_attributes.csv', productAttributes);
    writeToCSV('product_skus.csv', productSkus);
    writeToCSV('payments.csv', payments);
}

generateData();
