const validateBody = (schema) => (req, res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
        res.status(422);
        const details = r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' | ');
        return next(new Error(details));
    }
    req.body = r.data;
    next();
};

const validateQuery = (schema) => (req, res, next) => {
    const r = schema.safeParse(req.query);
    if (!r.success) {
        res.status(422);
        const details = r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' | ');
        return next(new Error(details));
    }
    req.query = r.data;
    next();
};

module.exports = { validateBody, validateQuery };
