const mongoose = require('mongoose');

const isNumeric = x => /^\d+$/.test(String(x));

async function findByAnyId(Model, id, projection) {
    if (!id) return null;

    // 123 => serial
    if (isNumeric(id)) return Model.findOne({ serial: Number(id) }, projection);

    // 65bd... => ObjectId
    if (mongoose.isValidObjectId(id)) return Model.findById(id, projection);

    // uuid ή custom public id πεδία
    return Model.findOne(
        { $or: [ { publicId: id }, { id }, { uuid: id } ] },
        projection
    );
}

// Επιστρέφει ΠΑΝΤΑ ObjectId ή πετά 404
async function requireObjectId(Model, id, entityName = 'Resource') {
    // Ειδική περίπτωση για Category slug
    if (
        Model.modelName === 'Category' &&
        typeof id === 'string' &&
        /^[a-z0-9-]+$/.test(id) &&
        !mongoose.isValidObjectId(id) &&
        !isNumeric(id)
    ) {
        const bySlug = await Model.findOne({ slug: id }).select('_id');
        if (!bySlug) { const e = new Error(`${entityName} not found`); e.status = 404; throw e; }
        return bySlug._id;
    }

    const doc = await findByAnyId(Model, id, { _id: 1 });
    if (!doc) { const e = new Error(`${entityName} not found`); e.status = 404; throw e; }
    return doc._id;
}

module.exports = { findByAnyId, requireObjectId };
