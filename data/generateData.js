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
            discount_rate: (Math.random() * (30 - 10) + 10).toFixed(2), // Discount rate between 10% - 30%
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
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            email: faker.internet.email(),
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            password: 'password123'
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
            is_main: Math.random() < 0.5,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        });
    }
    return productAssets;
}
function generateStockHistory(num, productCount) {
    const stockHistory = [];
    for (let i = 0; i < num; i++) {
        stockHistory.push({
            id: i + 1,
            product_id: Math.floor(Math.random() * productCount) + 1,
            quantity: Math.floor(Math.random() * 100) + 1,
            arrival_time: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0]
        });
    }
    return stockHistory;
}

// Generate data
const categories = generateCategories(10);
const products = generateProducts(50, categories.length);
const users = generateUsers(20);
const addresses = generateAddresses(30, users.length);
const orders = generateOrders(15, users.length);
const orderItems = generateOrderItems(40, orders.length, products.length);
const coupons = generateCoupons(10);
const carts = generateCarts(15, users.length);
const cartItems = generateCartItems(30, carts.length, products.length);
const reviews = generateReviews(20, products.length, users.length);
const assets = generateAssets(20);
const productAssets = generateProductAssets(30, products.length, assets.length);
const stockHistory = generateStockHistory(30, products.length); // Sinh ra 100 dòng lịch sử nhập kho

// Writing CSV files
const writeCSV = (fileName, data) => {
    const csvWriter = createObjectCsvWriter({
        path: fileName,
        header: Object.keys(data[0]).map(key => ({ id: key, title: key }))
    });
    return csvWriter.writeRecords(data);
};

Promise.all([
    writeCSV('categories.csv', categories),
    writeCSV('products.csv', products),
    writeCSV('users.csv', users),
    writeCSV('addresses.csv', addresses),
    writeCSV('orders.csv', orders),
    writeCSV('OrderItem.csv', orderItems),
    writeCSV('coupons.csv', coupons),
    writeCSV('carts.csv', carts),
    writeCSV('cart_items.csv', cartItems),
    writeCSV('reviews.csv', reviews),
    writeCSV('assets.csv', assets),
    writeCSV('product_assets.csv', productAssets),
    writeCSV('stock_history.csv', stockHistory) // Thêm dòng này
])
    .then(() => {
        console.log('Data generation completed successfully!');
    })
    .catch((error) => {
        console.error('Error generating data:', error);
    });
