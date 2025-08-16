// server/src/middlewares/auth.js
const { verifyAccess } = require('../utils/jwt');
const { ACCESS_COOKIE_NAME } = require('../utils/cookies');

function getTokenFromReq(req) {
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) return h.slice(7);              // μόνο JWT, χωρίς "Bearer "
    if (req.cookies?.[ACCESS_COOKIE_NAME]) return req.cookies[ACCESS_COOKIE_NAME];
    return null;
}

function requireAuth(req, _res, next) {
    const token = getTokenFromReq(req);
    if (!token) {
        const e = new Error('Missing token');
        e.status = 401;
        return next(e);
    }
    try {
        const payload = verifyAccess(token); // ✅ ίδια βιβλιοθήκη με το sign
        req.user = {
            id: String(payload.sub),
            roles: payload.roles || ['USER'],
            serial: payload.serial,
            publicId: payload.publicId
        };
        return next();
    } catch (err) {
        err.status = 401;
        err.message = 'Invalid or expired token';
        return next(err);
    }
}

// απλό RBAC helper, αν το χρησιμοποιείς
function requireRole(...allowed) {
    return (req, _res, next) => {
        if (!req.user?.roles?.some(r => allowed.includes(r))) {
            const e = new Error('Forbidden - insufficient role');
            e.status = 403;
            return next(e);
        }
        next();
    };
}

module.exports = { requireAuth, requireRole, getTokenFromReq };
