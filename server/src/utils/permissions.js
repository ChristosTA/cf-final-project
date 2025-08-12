const toStr = v => (v && v.toString ? v.toString() : String(v));

function hasRole(user, role) {
    return Array.isArray(user?.roles) && user.roles.includes(role);
}
function hasAnyRole(user, roles = []) {
    return roles.some(r => hasRole(user, r));
}
function isAdmin(user) {
    return hasRole(user, 'ADMIN');
}
function isOwner(user, ownerId) {
    return toStr(user?.id) === toStr(ownerId);
}
function forbid(message = 'Forbidden', status = 403) {
    const e = new Error(message);
    e.status = status;
    throw e;
}
/** Ρίχνει 403 αν ΔΕΝ είναι owner ΟΥΤΕ admin */
function ensureOwnerOrAdmin(user, ownerId) {
    if (!(isAdmin(user) || isOwner(user, ownerId))) {
        forbid();
    }
}

module.exports = {
    hasRole,
    hasAnyRole,
    isAdmin,
    isOwner,
    ensureOwnerOrAdmin,
};
