const { requireObjectId } = require('../utils/findByAnyId');

// Δέχεται serial | uuid | _id στο req[source][paramName] και το μετατρέπει σε Mongo ObjectId
const bindObjectId = (paramName, Model, source = 'params', entity = 'Resource') => {
    return async (req, res, next) => {
        try {
            const raw = req[source]?.[paramName];
            if (!raw) {
                res.status(400);
                return next(new Error(`Missing ${entity} id param '${paramName}'`));
            }
            const objectId = await requireObjectId(Model, raw, entity);
            req[source][paramName] = objectId; // αντικαθιστούμε με ObjectId
            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = bindObjectId;
