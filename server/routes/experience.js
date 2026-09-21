'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/experienceController');
const { requireExperienceSessionPage } = require('../middleware/auth');

router.get('/no-disponible', ctrl.unavailable);
router.get('/api/intro', ctrl.intro);

// Pagina de confesion: protegida por sesion valida.
router.get('/confesion', requireExperienceSessionPage, ctrl.confessionPage);

// Enlace privado con token.
router.get('/sorpresa/:token', ctrl.experience);

module.exports = router;
