const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { Redis } = require('ioredis');


// Middleware para limitar solicitudes (previene DDOS)
const limiter = rateLimit({
    windowMs: 1000, // 1 segundo
    max: 5, // Máximo 5 peticiones por IP en 1 segundo
    handler: (req, res) => {
        res.status(429).json({ message: 'Demasiadas solicitudes, intenta más tarde.' });
    }
});

// Middleware para retrasar solicitudes de IPs reincidentes
const slowDownMiddleware = slowDown({
    windowMs: 60000, // 1 minuto de seguimiento
    delayAfter: 10, // Si una IP alcanza 10 bloqueos
    delayMs: () => 60000, // Se retrasa 1 minuto
});

// Exportar middlewares
module.exports = {
    limiter,
    slowDownMiddleware
};
