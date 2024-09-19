const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Import sequelize từ file config

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  firstName: {
    type: DataTypes.STRING,
    field: 'first_name', // Trường trong DB
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    field: 'last_name', // Trường trong DB
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  birthOfDate: {
    type: DataTypes.DATEONLY,
    field: 'birth_of_date',
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at', 
    defaultValue: DataTypes.NOW,
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at', 
    allowNull: true,
  },
}, {
  tableName: 'users',  
  timestamps: false,  
  paranoid: true,     
});

module.exports = User;
