const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectUser = sequelize.define('ProjectUser', {
    user_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
    },
    project_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
    },
    rol: {
        type: DataTypes.ENUM('OWNER', 'WORKER', 'READER'),
        defaultValue: 'READER'
    }
}, { tableName: 'project_users', timestamps: false });

module.exports = ProjectUser;
