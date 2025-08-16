// src/middlewares/validate.js
const validateBody = (schema) => (req, res, next) => {
    if (!schema || typeof schema.safeParse !== 'function') {
        const err = new Error('Validator missing or invalid');
        err.status = 500;
        return next(err);
    }
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        const e = new Error('Unprocessable Entity');
        e.status = 422;
        e.details = parsed.error.flatten();
        return next(e);
    }
    res.locals.validated = parsed.data; // αν το χρειαστείς
    next();
};

const validateQuery = (schema) => (req, res, next) => {
    if (!schema || typeof schema.safeParse !== 'function') {
        const err = new Error('Validator missing or invalid');
        err.status = 500;
        return next(err);
    }
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
        const e = new Error('Unprocessable Entity');
        e.status = 422;
        e.details = parsed.error.flatten();
        return next(e);
    }
    req.query = parsed.data; // αντικαθιστούμε με το κανονικοποιημένο
    next();
};

module.exports = { validateBody, validateQuery };
