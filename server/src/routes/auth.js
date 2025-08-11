const router = require('express').Router();
const { validateBody } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const { registerSchema, loginSchema } = require('../api/validators/authSchemas');
const { changePasswordSchema } = require('../api/validators/securitySchemas');
const ctrl = require('../controllers/authController');

router.post('/register', validateBody(registerSchema), ctrl.register);
router.post('/login',    validateBody(loginSchema),    ctrl.login);
router.patch('/password', requireAuth, validateBody(changePasswordSchema), ctrl.changePassword);

module.exports = router;
