const { validateBody, validateQuery, validateParams } = require('../../middlewares/validate');

module.exports = {
    body: validateBody,
    query: validateQuery,
    params: validateParams || ((schema) => (req, res, next) => next()),

    // aliases για ό,τι ήδη χρησιμοποιείς
    validateBody,
    validateQuery,
};