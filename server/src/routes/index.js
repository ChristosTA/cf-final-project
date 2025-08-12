const express = require('express');
const router = express.Router();


router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/categories', require('./categories'));
router.use('/listings', require('./listings'));
router.use('/orders', require('./orders'));
router.use('/', require('./favorites'));


const { requireAuth } = require('../middlewares/auth');
router.get('/me', requireAuth, (req, res) => {
    res.json({ userId: req.user.id, role: req.user.role });
});

module.exports = router;
