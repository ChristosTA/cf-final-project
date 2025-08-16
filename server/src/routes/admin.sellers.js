
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const adminSellerCtrl = require('../controllers/adminSellerController');
const bindObjectId = require('../middlewares/bindObjectId');
const User = require('../models/user.Model');
const { z } = require('zod');

router.use(requireAuth, requireRole('ADMIN'));

const bindUserId = bindObjectId('id', User, 'params', 'User');

router.post('/sellers/:id/approve', bindUserId, adminSellerCtrl.approve);

// reason OR note (tests στέλνουν note)
const RejectSchema = z.object({
    reason: z.string().min(2).optional(),
    note: z.string().min(2).optional()
}).refine(v => v.reason || v.note, { message: 'reason or note required' })
    .transform(v => ({ reason: v.reason || v.note }));

router.post('/sellers/:id/reject', bindUserId, validateBody(RejectSchema), adminSellerCtrl.reject);

// need-more-info: δέξου message ή note
const NeedInfoSchema = z.object({
    message: z.string().min(2).optional(),
    note: z.string().min(2).optional()
}).refine(v => v.message || v.note, { message: 'message or note required' })
    .transform(v => ({ message: v.message || v.note }));

router.post('/sellers/:id/need-more-info', bindUserId, validateBody(NeedInfoSchema), adminSellerCtrl.needMoreInfo);

module.exports = router;
