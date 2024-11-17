const knex = require("../config/database").db;

const getListCategory = async () => {
    return await knex("Category").select("*");
};

module.exports = {
    getListCategory,
};