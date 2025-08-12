const { requireObjectId } = require('../utils/findByAnyId'); // έχεις ήδη το helper
const Category = require('../models/category.Model'); // προσαρμοσε το όνομα αν διαφέρει

// field: "categories", location: 'body' | 'query'
// resolver: ποια οντότητα λύνεις (εδώ πάντα Category, αλλά άστο γενικό)
module.exports = function resolveIdsArrayFactory(Model, field, location = 'body', entityName = 'Resource') {
    return async (req, res, next) => {
        try {
            const src = req[location] || {};
            const val = src[field];
            if (!val) return next();
            const ids = Array.isArray(val) ? val : [val];

            // ειδική στήριξη για slug: αν μοιάζει με "slug" (όχι numeric/objectId/uuid) προσπάθησε by slug
            const out = [];
            for (const x of ids) {
                // αν είναι slug και Model === Category
                if (Model.modelName === 'Category' && /^[a-z0-9-]+$/.test(String(x)) && !/^\d+$/.test(String(x))) {
                    const bySlug = await Model.findOne({ slug: String(x) }).select('_id');
                    if (!bySlug) {
                        res.status(404);
                        throw new Error(`Category not found: ${x}`);
                    }
                    out.push(bySlug._id);
                    continue;
                }
                // αλλιώς, serial/uuid/_id
                const oid = await requireObjectId(Model, x, entityName);
                out.push(oid);
            }

            req[location][field] = out; // αντικατάσταση με ObjectId[]
            next();
        } catch (e) { next(e); }
    };
};
