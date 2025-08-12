const mongoose = require('mongoose');

function isNumeric(x){ return /^\d+$/.test(String(x)); }

/**
 * Δέχεται serial | ObjectId | UUID και επιστρέφει το Mongoose doc (ή null)
 */
async function findByAnyId(Model, id, projection) {
    if (!id) return null;
    if (isNumeric(id)) return Model.findOne({ serial: Number(id) }, projection);
    if (mongoose.isValidObjectId(id)) return Model.findById(id, projection);
    return Model.findOne({ publicId: id }, projection);
}

/**
 * Ό,τι κι αν δώσεις, σου επιστρέφει ΜΟΝΟ το Mongo _id (ή πετάει 404)
 */
async function requireObjectId(Model, id, entityName = 'Resource') {
    // Στήριξη και για slug αν το Model έχει πεδίο slug (π.χ. Category)
    if (Model.modelName === 'Category' && typeof id === 'string' &&
        /^[a-z0-9-]+$/.test(id) && !/^\d+$/.test(id) && !mongoose.isValidObjectId(id)) {
        const bySlug = await Model.findOne({ slug: id }).select('_id');
        if (!bySlug) { const e = new Error(`${entityName} not found`); e.status = 404; throw e; }
        return bySlug._id;
    }

    const doc = await findByAnyId(Model, id, { _id: 1 });
    if (!doc) {
        const e = new Error(`${entityName} not found`);
        e.status = 404;
        throw e;
    }
    return doc._id;
}

module.exports = { findByAnyId, requireObjectId };
