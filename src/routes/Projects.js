const express = require("express");
const { auth } = require("../middleware/auth");
const Project = require('../models/Project');
const ProjectUser = require('../models/ProjectUser');
const { Op } = require("sequelize");
const router = express.Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Obtener proyectos donde el usuario es líder o miembro
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar proyectos donde el usuario es líder o miembro
        const projects = await Project.findAll({
            where: {
                [Op.or]: [
                    { lider_id: userId },
                    { '$project_users.user_id$': userId }
                ]
            },
            include: [
                {
                    model: ProjectUser,
                    as: 'project_users',
                    attributes: [] // No necesitamos traer datos extra de la tabla intermedia
                }
            ]
        });

        res.json({ projects });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Crear un nuevo proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: project
 *         description: Datos del nuevo proyecto
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       201:
 *         description: Proyecto creado exitosamente
 *       400:
 *         description: Datos faltantes en la solicitud
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }

        // Crear el proyecto
        const newProject = await Project.create({
            id: require('uuid').v4(), // Genera un UUID
            name,
            description,
            lider_id: req.user.id,
            createdAt: new Date()
        });

        // Agregar al líder como OWNER en project_users
        await ProjectUser.create({
            user_id: req.user.id,
            project_id: newProject.id,
            rol: 'OWNER'
        });

        res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Actualizar un proyecto existente
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del proyecto
 *       - in: body
 *         name: project
 *         description: Datos a actualizar del proyecto
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       200:
 *         description: Proyecto actualizado exitosamente
 *       403:
 *         description: El usuario no está autorizado a realizar esta acción
 *       404:
 *         description: Proyecto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;

        // Verificar si el usuario es el OWNER del proyecto en ProjectUser
        const projectUser = await ProjectUser.findOne({
            where: {
                project_id: id,
                user_id: userId,
                rol: 'OWNER'  // Solo permitimos que el OWNER haga cambios
            }
        });

        if (!projectUser) {
            return res.status(403).json({ error: "You are not authorized to update this project" });
        }

        // Buscar y actualizar el proyecto
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        project.name = name || project.name;
        project.description = description || project.description;

        await project.save();

        res.json({ message: "Project updated successfully", project });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Eliminar un proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del proyecto
 *     responses:
 *       200:
 *         description: Proyecto eliminado exitosamente
 *       403:
 *         description: El usuario no está autorizado a eliminar este proyecto
 *       404:
 *         description: Proyecto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar si el usuario es el OWNER del proyecto en ProjectUser
        const projectUser = await ProjectUser.findOne({
            where: {
                project_id: id,
                user_id: userId,
                rol: 'OWNER'  // Solo el OWNER puede eliminar
            }
        });

        if (!projectUser) {
            return res.status(403).json({ error: "You are not authorized to delete this project" });
        }

        // Buscar el proyecto
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Eliminar el proyecto y sus asociaciones en ProjectUser
        await ProjectUser.destroy({ where: { project_id: id } });
        await project.destroy();

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/projects/{id}/add-user:
 *   post:
 *     summary: Agregar un usuario a un proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del proyecto
 *       - in: body
 *         name: user
 *         description: Datos del usuario a agregar
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             user_id:
 *               type: string
 *     responses:
 *       201:
 *         description: Usuario agregado exitosamente
 *       403:
 *         description: El usuario no está autorizado a agregar usuarios
 *       400:
 *         description: El usuario ya es miembro del proyecto
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/add-user', auth, async (req, res) => {
    try {
        const { id } = req.params; // ID del proyecto
        const { user_id } = req.body; // ID del usuario a agregar
        const ownerId = req.user.id; // ID del usuario autenticado

        // Verificar si el usuario autenticado es OWNER del proyecto
        const projectOwner = await ProjectUser.findOne({
            where: {
                project_id: id,
                user_id: ownerId,
                rol: 'OWNER'  // Solo el OWNER puede añadir usuarios
            }
        });

        if (!projectOwner) {
            return res.status(403).json({ error: "You are not authorized to add users to this project" });
        }

        // Verificar si el usuario ya está en el proyecto
        const existingMember = await ProjectUser.findOne({
            where: {
                project_id: id,
                user_id: user_id
            }
        });

        if (existingMember) {
            return res.status(400).json({ error: "User is already a member of this project" });
        }

        // Agregar usuario al proyecto con rol "READER"
        await ProjectUser.create({
            user_id: user_id,
            project_id: id,
            rol: 'READER'
        });

        res.status(201).json({ message: "User added to project successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
