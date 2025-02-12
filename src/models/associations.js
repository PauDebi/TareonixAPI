const User = require('./User');
const Project = require('./Project');
const ProjectUser = require('./ProjectUser');

// Relaciones
User.hasMany(ProjectUser, { foreignKey: 'user_id' });
Project.hasMany(ProjectUser, { foreignKey: 'project_id', as: 'project_users' });
ProjectUser.belongsTo(User, { foreignKey: 'user_id' });
ProjectUser.belongsTo(Project, { foreignKey: 'project_id' });

module.exports = { User, Project, ProjectUser };
