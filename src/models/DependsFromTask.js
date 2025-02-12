const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DependsFromTask = sequelize.define('DependsFromTask', {
    dependent_task: {
        type: DataTypes.UUID,
        references: {
            model: Task,
            key: 'id'
        }
    },
    primary_task: {
        type: DataTypes.UUID,
        references: {
            model: Task,
            key: 'id'
        }
    }
}, { primaryKey: ['dependent_task', 'primary_task'] });

module.exports = DependsFromTask;