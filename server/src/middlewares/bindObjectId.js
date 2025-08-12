// src/middlewares/bindObjectId.js
const { requireObjectId } = require('../utils/resolveId');

/**
 * Δέχεται ένα πεδίο (π.χ. "listingId") και αντικαθιστά την τιμή του
 * με το αντίστοιχο Mongo _id, ανεξάρτητα αν έρθει serial, uuid, ή _id.
 *
 * @param {string} field - Το όνομα του πεδίου (π.χ. "listingId")
 * @param {mongoose.Model} Model - Το μοντέλο που θα ψάξει
 * @param {string} source - Από πού θα διαβάσει (default: 'params')
 * @param {string} entityName - Όνομα entity για μήνυμα λάθους
 */
function bindObjectId(field, Model, source = 'params', entityName = field) {
    return async (req, res, next) => {
        try {
            const raw = req[source]?.[field];
            if (!raw) return next(); // validation το χειρίζεται αλλού
            req[source][field] = await requireObjectId(Model, raw, entityName);
            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = { bindObjectId };
