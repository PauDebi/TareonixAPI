const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskHistory = sequelize.define('TaskHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
    },
    task_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    action_date: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'task_history',
    timestamps: false
});

module.exports = TaskHistory;