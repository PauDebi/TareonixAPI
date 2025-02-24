require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { limiter, slowDownMiddleware } = require('./middleware/rateLimiter');
const path = require('path');

const sequelize = require('./config/database');
require('./models/associations');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/Projects');
const taskRoutes = require('./routes/Tareas');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(slowDownMiddleware);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/uploads', express.static('uploads'));

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management API',
      version: '1.0.0',
      description: 'API for managing events and registrations'
    },
    servers: [
      {
        url: 'worldgames.es/',
        description: 'El unico servidor, somos pobres'
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints for user authentication and registration'
      },
      {
        name: 'User',
        description: 'Endpoints for user information'
      },
      {
        name: 'Tasks',
        description: 'Endpoints for task management'
      },
      {
        name: 'Projects',
        description: 'Endpoints for project management'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Database sync and server start
const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});