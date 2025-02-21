const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    project_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    assigned_user_id: {
        type: DataTypes.UUID,
    },
    status : {
        type: DataTypes.ENUM('TO_DO', 'IN_PROGRESS', 'DONE'),
        defaultValue: 'TO_DO',
        allowNull: false,
    },

}
    , {
        tableName: 'tasks',
        timestamps: false
    }
);

module.exports = Task;