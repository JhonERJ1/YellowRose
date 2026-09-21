'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/apiController');
const { requireExperienceSession } = require('../middleware/auth');
const { apiLimiter, initLimiter } = require('../middleware/rateLimit');

router.use(apiLimiter);

// Arranque de sesion / activacion del enlace.
router.post('/init', initLimiter, ctrl.init);

// Rutas que requieren una sesion valida (token + dispositivo + sesion).
router.post('/event', requireExperienceSession, ctrl.event);
router.post('/confession', requireExperienceSession, ctrl.confession);
router.post('/response', requireExperienceSession, ctrl.respond);

module.exports = router;
