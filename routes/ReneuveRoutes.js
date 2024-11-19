const express = require('express');
const router = express.Router();

const { getDashboardOverview } = require('../controllers/ReneuveController');

router.get('/revenue/dashboard', getDashboardOverview);

module.exports = router;