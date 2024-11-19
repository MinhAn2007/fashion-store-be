const RevenueService = require('../services/ReneuveService');

const getDashboardOverview = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        const data = await RevenueService.getDashboardOverview(startDate, endDate);
        res.json(data);
    } catch (error) {
        console.error("Error fetching dashboard data:", error.message); // Log the error
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = {
    getDashboardOverview,
};