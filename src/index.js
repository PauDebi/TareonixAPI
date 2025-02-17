const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

// Definir la configuración de Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Proyectos',
      version: '1.0.0',
      description: 'Documentación de la API de gestión de proyectos',
      contact: {
        name: 'Admin',
        email: 'admin@worldgames.es',
      },
    },
  },
  apis: ['./src/routes/*.js'],

};

// Crear la especificación de Swagger
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Rutas de la API (tu archivo de rutas)
const projectRoutes = require('./routes/projects'); // Cambia la ruta si es diferente

// Usar Swagger UI en la ruta '/api-docs'
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Usar las rutas del proyecto
app.use('/projects', projectRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
});
