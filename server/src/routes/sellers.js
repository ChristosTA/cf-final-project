const router = require('express').Router();
const ctrl = require('../controllers/sellerController');

router.get('/:id', ctrl.summary); // δημόσιο

module.exports = router;
