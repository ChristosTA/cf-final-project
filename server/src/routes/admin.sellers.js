const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const adminSellerCtrl = require('../controllers/adminSellerController');
const bindObjectId = require('../middlewares/bindObjectId');
const User = require('../models/user.Model');
const { z } = require('zod');

router.use(requireAuth, requireRole('ADMIN'));

const bindUserId = bindObjectId('id', User, 'params', 'User');

router.post('/sellers/:id/approve', bindUserId, adminSellerCtrl.approve); // ✅ no validator
router.post('/sellers/:id/reject', bindUserId, validateBody(z.object({ reason: z.string().min(2) })), adminSellerCtrl.reject);
router.post('/sellers/:id/need-more-info', bindUserId, validateBody(z.object({ message: z.string().min(2) })), adminSellerCtrl.needMoreInfo);

module.exports = router;
