const router = require('express').Router();
const { validateBody } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { createCategorySchema, updateCategorySchema } = require('../api/validators/categorySchemas');
const ctrl = require('../controllers/categoryController');

router.get('/', ctrl.list);
router.get('/:slugOrId', ctrl.get);

router.post('/',
    requireAuth, requireRole('ADMIN'),
    validateBody(createCategorySchema),
    ctrl.create
);

router.patch('/:id',
    requireAuth, requireRole('ADMIN'),
    validateBody(updateCategorySchema),
    ctrl.update
);

router.delete('/:id',
    requireAuth, requireRole('ADMIN'),
    ctrl.remove
);

module.exports = router;
