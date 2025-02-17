const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DependsFromTask = sequelize.define('dependsFromTask', {
    dependent_task: {
        type: DataTypes.CHAR(36),
        references: {
            model: 'Tasks',
            key: 'id'
        }
    },
    primary_task: {
        type: DataTypes.CHAR(36),
        references: {
            model: 'Tasks',
            key: 'id'
        }
    }
}, {
    timestamps: true // Si deseas tener las columnas createdAt y updatedAt
});

module.exports = DependsFromTask;
