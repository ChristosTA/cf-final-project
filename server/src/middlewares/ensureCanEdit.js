const asyncHandler = require('./asyncHandler'); // το δικό σου wrapper
const { ensureOwnerOrAdmin } = require('../utils/permissions');

// Factory: δώσε μου πώς βρίσκω το ownerId του resource, εγώ κάνω τον έλεγχο.
function ensureCanEditFactory(resolveOwnerId) {
    return asyncHandler(async (req, _res, next) => {
        const ownerId = await resolveOwnerId(req);
        if (!ownerId) {
            const e = new Error('Owner not found');
            e.status = 404;
            throw e;
        }
        ensureOwnerOrAdmin(req.user, ownerId);
        return next();
    });
}

module.exports = { ensureCanEditFactory };
