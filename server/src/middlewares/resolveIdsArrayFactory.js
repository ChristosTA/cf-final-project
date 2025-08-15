// src/middlewares/resolveIdsArrayFactory.js
const { requireObjectId } = require('../utils/findByAnyId');

/**
 * Μετατρέπει ένα πεδίο array (ή single value) από serial/uuid/_id/slug => [Mongo ObjectId]
 * @param {'params'|'query'|'body'} source - από πού θα διαβάσει (π.χ. 'query')
 * @param {string} field - το όνομα του πεδίου (π.χ. 'categories')
 * @param {Model} Model - Mongoose Model που θα λυθεί (π.χ. Category)
 * @param {string} entityName - φιλικό όνομα οντότητας για μηνύματα (π.χ. 'Category')
 */
module.exports = function resolveIdsArrayFactory(source, field, Model, entityName = 'Resource') {
    return async (req, res, next) => {
        try {
            const container = req[source] || {};
            const v = container[field];
            if (!v) return next();

            const arr = Array.isArray(v) ? v : [v];
            const ids = [];
            for (const x of arr) {
                const id = await requireObjectId(Model, x, entityName);
                ids.push(id);
            }

            container[field] = ids;      // αντικαθιστά με ObjectIds
            req[source] = container;     // διασφαλίζουμε ότι μένει πίσω η αλλαγή
            next();
        } catch (err) {
            next(err);
        }
    };
};
