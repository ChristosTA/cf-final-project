const jwt = require('jsonwebtoken');
const { ACCESS_COOKIE_NAME } = require('../utils/cookies');


function requireAuth(req, res, next) {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) { res.status(401); return next(new Error('Missing token')); }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.sub, roles: payload.roles || ['USER'] };
        next();
    } catch {
        res.status(401);
        next(new Error('Invalid or expired token'));
    }
}

function requireRole(...allowed) {
    return (req, res, next) => {
        if (!req.user || !req.user.roles?.some(r => allowed.includes(r))) {
            res.status(403);
            return next(new Error('Forbidden - insufficient role'));
        }
        next();
    };
}


function getTokenFromReq(req) {
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) return h.slice(7);
    // fallback: cookie-mode
    if (req.cookies && req.cookies[ACCESS_COOKIE_NAME]) return req.cookies[ACCESS_COOKIE_NAME];
    return null;
}

module.exports = { requireAuth, requireRole, getTokenFromReq };
