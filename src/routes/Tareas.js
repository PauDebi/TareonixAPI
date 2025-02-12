const express = require("express");
const {auth} = require("../middleware/auth");
const {Op} = require("sequelize");
const router = express.Router();
const {ProjectUser, Project, Task, TaskHistory} = require("../models/associations");

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
            where: { project_id: id }
        });

        res.json({ tasks });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
}
);

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

module.exports = router;