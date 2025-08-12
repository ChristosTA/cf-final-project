const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { updateMeSchema } = require('../api/validators/userSchemas');
const userCtrl = require('../controllers/userController');


router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/categories', require('./categories'));
router.use('/listings', require('./listings'));
router.use('/orders', require('./orders'));
router.use('/favorites', require('./favorites'));


router.get('/me', requireAuth, userCtrl.me);
router.put('/me', requireAuth, validateBody(updateMeSchema), userCtrl.updateMe);

module.exports = router;
