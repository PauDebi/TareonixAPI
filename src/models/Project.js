const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
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
  lider_id: {
    type: DataTypes.UUID,
    allowNull: true, // Puede ser null si no hay líder
    references: {
      model: 'users', // 👈 Usamos el nombre de la tabla, NO el modelo directamente
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'projects',
  timestamps: false
});



module.exports = Project;
