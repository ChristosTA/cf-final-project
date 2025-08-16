const router = require('express').Router();
const { validateBody } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const { registerSchema, loginSchema } = require('../api/validators/authSchemas');
const {
    changePasswordSchema, refreshSchema, recoveryRequestSchema, recoveryConfirmSchema
} = require('../api/validators/securitySchemas');
const ctrl = require('../controllers/authController');
const { issueCsrfToken } = require('../middlewares/csrf');


router.post('/register', validateBody(registerSchema), ctrl.register);
router.post('/login',    validateBody(loginSchema),    ctrl.login);

router.patch('/password', requireAuth, validateBody(changePasswordSchema), ctrl.changePassword);

// NEW:
router.post('/refresh',  validateBody(refreshSchema),  ctrl.refresh);
router.post('/logout',   validateBody(refreshSchema).optional?.() || ((req,res,next)=>next()), ctrl.logout);

router.post('/recovery/request', validateBody(recoveryRequestSchema), ctrl.requestRecovery);
router.post('/recovery/confirm', validateBody(recoveryConfirmSchema), ctrl.confirmRecovery);

// --- Cookie-mode (SSR-friendly) ---
router.post('/login-cookie',   validateBody(loginSchema), ctrl.loginCookie);
// refresh-cookie ΔΕΝ απαιτεί body (παίρνει απ' το cookie)
router.post('/refresh-cookie', ctrl.refreshCookie);
// logout-cookie καθαρίζει cookies + revoke refresh
router.post('/logout-cookie',  ctrl.logoutCookie);

router.get('/csrf', issueCsrfToken);

module.exports = router;
