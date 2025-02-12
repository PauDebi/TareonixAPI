const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');

const ProjectUser = sequelize.define('ProjectUser', {
    user_id: {
        type: DataTypes.UUID,
        references: {
            model: User,
            key: 'id'
        }
    },
    project_id: {
        type: DataTypes.UUID,
        references: {
            model: Project,
            key: 'id'
        }
    },
    rol: {
        type: DataTypes.ENUM('OWNER', 'WORKER', 'READER'),
        defaultValue: 'READER'
    }
}, { primaryKey: ['user_id', 'project_id'] });

module.exports = ProjectUser;