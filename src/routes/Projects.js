const express = require("express");
const {auth} = require("../middleware/auth");
const Project = require('../models/Project');
const ProjectUser = require('../models/ProjectUser');
const {Op} = require("sequelize");
const router = express.Router();


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