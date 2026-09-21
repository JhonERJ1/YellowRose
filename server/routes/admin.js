'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { requireAdmin, requireAdminApi } = require('../middleware/auth');
const { adminLoginLimiter } = require('../middleware/rateLimit');

router.get('/login', ctrl.loginPage);
router.post('/login', adminLoginLimiter, ctrl.login);
router.post('/logout', ctrl.logout);

router.get('/', requireAdmin, ctrl.dashboard);
router.get('/api/data', requireAdminApi, ctrl.data);
router.post('/api/generate', requireAdminApi, ctrl.generateLink);
router.post('/api/delete', requireAdminApi, ctrl.deleteAccess);

module.exports = router;
