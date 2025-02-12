const express = require("express");
const {auth} = require("../middleware/auth");
const Project = require('../models/User');
const ProjectUser = require('../models/ProjectUser');
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
            lider_id: null,
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

module.exports = router;
