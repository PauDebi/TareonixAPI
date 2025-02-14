const User = require('./User');
const Project = require('./Project');
const ProjectUser = require('./ProjectUser');
const TaskHistory = require('./TaskHistory');
const Task = require('./Task');

// Relaciones
User.hasMany(ProjectUser, { foreignKey: 'user_id' });
Project.hasMany(ProjectUser, { foreignKey: 'project_id', as: 'project_users' });
ProjectUser.belongsTo(User, { foreignKey: 'user_id' });
ProjectUser.belongsTo(Project, { foreignKey: 'project_id' });
Task.hasMany(TaskHistory, { foreignKey: 'task_id', as: 'history' });
TaskHistory.belongsTo(Task, { foreignKey: 'task_id' });
TaskHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(TaskHistory, { foreignKey: 'user_id', as: 'taskHistories' });


module.exports = { User, Project, ProjectUser , Task, TaskHistory };
