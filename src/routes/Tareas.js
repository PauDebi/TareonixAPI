const express = require("express");
const { auth } = require("../middleware/auth");
const { Op } = require("sequelize");
const router = express.Router();
const { ProjectUser, Project, Task, TaskHistory, User } = require("../models/associations");

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get tasks for a project
 *     tags: [Tasks]
 *     description: Retrieve all tasks for a project that the authenticated user is a member of.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the project.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of tasks for the project.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Task Name"
 *                       description:
 *                         type: string
 *                         example: "Task description"
 *                       history:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             action:
 *                               type: string
 *                               example: "CREATED"
 *                             action_date:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-02-17T00:00:00Z"
 *                             user:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 1
 *                                 name:
 *                                   type: string
 *                                   example: "John Doe"
 *                                 email:
 *                                   type: string
 *                                   example: "user@example.com"
 *       403:
 *         description: User is not authorized to view tasks for this project.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params; // ID del proyecto
        const userId = req.user.id; // ID del usuario autenticado

        // Verificar si el usuario es miembro del proyecto
        const projectUser = await ProjectUser.findOne({
            where: {
                project_id: id,
                user_id: userId
            }
        });

        if (!projectUser) {
            return res.status(403).json({ error: "You are not authorized to view tasks for this project" });
        }

        // Obtener todas las tareas del proyecto
        const tasks = await Task.findAll({
            where: { project_id: id },
            include: [
                {
                    model: TaskHistory,
                    as: 'history', // Alias para la relación
                    attributes: ['id', 'action', 'action_date'],
                    include: [
                        {
                            model: User,
                            as: 'user', // Alias para la relación con el usuario
                            attributes: ['id', 'name', 'email'] // Selecciona los campos que quieras
                        }
                    ]
                }
            ]
        });

        res.json({ tasks });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   post:
 *     summary: Create a new task for a project
 *     tags: [Tasks]
 *     description: Create a new task in a project, available to members of the project with the correct role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the project.
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Task"
 *               description:
 *                 type: string
 *                 example: "Task description here."
 *     responses:
 *       200:
 *         description: Task created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "New Task"
 *                     description:
 *                       type: string
 *                       example: "Task description"
 *       403:
 *         description: User is not authorized to create tasks for this project.
 *       500:
 *         description: Internal server error.
 */
router.post('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params; // ID del proyecto
        const userId = req.user.id; // ID del usuario autenticado

        // Verificar si el usuario es miembro del proyecto
        const projectUser = await ProjectUser.findOne({
            where: {
                project_id: id,
                user_id: userId,
                rol: {
                    [Op.in]: ['OWNER', 'WOKER']
                }
            }
        });

        if (!projectUser) {
            return res.status(403).json({ error: "You are not authorized to create tasks for this project" });
        }

        // Crear la tarea
        const { name, description } = req.body;
        const task = await Task.create({
            name,
            description,
            project_id: id
        });

        res.json({ task });

        //Actualizar la tabla TaskHistory para tener un registro de la creación de la tarea
        await TaskHistory.create({
            user_id: userId,
            task_id: task.id,
            action: 'CREATED',
            action_date: new Date()
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task for a project
 *     tags: [Tasks]
 *     description: Update the details of an existing task in a project.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the task.
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Task"
 *               description:
 *                 type: string
 *                 example: "Updated description."
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Updated Task"
 *                     description:
 *                       type: string
 *                       example: "Updated description."
 *       403:
 *         description: User is not authorized to update tasks for this project.
 *       500:
 *         description: Internal server error.
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params; // ID de la tarea
        const userId = req.user.id; // ID del usuario autenticado
        const task = await Task.findByPk(id);

        if (!task) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }

        // Verificar si el usuario es miembro del proyecto
        const projectUser = await ProjectUser.findOne({
            where: {
                project_id: task.project_id,
                user_id: userId,
                rol: {
                    [Op.in]: ['OWNER', 'WOKER']
                }
            }
        });

        if (!projectUser) {
            return res.status(403).json({ error: "You are not authorized to update tasks for this project" });
        }

        // Actualizar la tarea
        const { name, description } = req.body;

        task.name = name || task.name;
        task.description = description || task.description;

        await task.save();

        //Actualizar la tabla TaskHistory para tener un registro de la actualización de la tarea
        await TaskHistory.create({
            user_id: userId,
            task_id: task.id,
            action: 'UPDATED',
            action_date: new Date()
        });

        res.json({ task });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task for a project
 *     tags: [Tasks]
 *     description: Delete a specific task from the project.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the task to delete.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tarea eliminada correctamente"
 *       403:
 *         description: User is not authorized to delete tasks for this project.
 *       500:
 *         description: Internal server error.
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params; // ID de la tarea
        const userId = req.user.id; // ID del usuario autenticado
        const task = await Task.findByPk(id);

        if (!task) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }

        // Verificar si el usuario es miembro del proyecto
        const projectUser = await ProjectUser.findOne({
            where: {
                project_id: task.project_id,
                user_id: userId,
                rol: {
                    [Op.in]: ['OWNER', 'WOKER']
                }
            }
        });

        if (!projectUser) {
            return res.status(403).json({ error: "You are not authorized to delete tasks for this project" });
        }

        // Eliminar la tarea
        await TaskHistory.destroy({ where: { task_id: id } });
        await task.destroy();

        res.json({ message: "Tarea eliminada correctamente" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}/asign-user-to:
 *   post:
 *     summary: Assign a user to a task
 *     tags: [Tasks]
 *     description: Assign a user to a task in the project.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the project.
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: User assigned to task successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario asignado correctamente"
 *       403:
 *         description: User is not authorized to assign users to tasks for this project.
 *       400:
 *         description: Missing user ID in request body.
 *       500:
 *         description: Internal server error.
 */
router.post('/asign-user-to/:id', auth, async (req, res) => {
    try {
        const { id } = req.params; // ID del proyecto
        const userId = req.user.id; // ID del usuario autenticado
        const { user_id } = req.body; // ID del usuario a asignar
        const project = await Project.findByPk(id);

        if (!user_id) {
            return res.status(400).json({ error: "User ID is required in request body" });
        }

        if (project.lider_id && project.lider_id !== userId) {
            return res.status(403).json({ error: "You are not authorized to assign users to tasks for this project" });
        }

        // Verificar si el usuario es miembro del proyecto
        const projectUser = await ProjectUser.findOne({
            where: {
                project_id: id,
                user_id: userId,
                rol: {
                    [Op.in]: ['OWNER', 'WOKER']
                }
            }
        });

        if (!projectUser) {
            return res.status(403).json({ error: "You are not authorized to assign users to tasks for this project" });
        }

        // Verificar si el usuario a asignar es miembro del proyecto
        const userProject = await ProjectUser.findOne({
            where: {
                project_id: projectUser.project_id,
                user_id,
                rol: {
                    [Op.in]: ['OWNER', 'WOKER']
                }
            }
        });

        if (!userProject) {
            return res.status(403).json({ error: "The user you are trying to assign is not a member of the project" });
        }

        // Verificar si la tarea existe
        const task = await Task.findByPk(id);

        if (!task) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }

        // Asignar el usuario a la tarea
        task.assigned_user_id = user_id;

        res.json({ message: "Usuario asignado correctamente" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
