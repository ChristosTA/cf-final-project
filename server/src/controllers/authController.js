const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../services/authService');

exports.register = asyncHandler(async (req, res) => {
    const user = await auth.register(req.body);
    res.status(201).json({ user });
});

exports.login = asyncHandler(async (req, res) => {
    const r = await auth.login(req.body);
    res.json(r);
});

exports.changePassword = asyncHandler(async (req, res) => {
    await auth.changePassword(req.user.id, req.body);
    res.json({ message: 'Password changed' });
});

// === ΝΕΑ ===
exports.refresh = asyncHandler(async (req, res) => {
    const out = await auth.refresh(req.body);
    res.json(out);
});

exports.logout = asyncHandler(async (req, res) => {
    await auth.logout(req.body || {});
    res.status(204).send();
});

exports.requestRecovery = asyncHandler(async (req, res) => {
    const out = await auth.requestRecovery(req.body);
    res.json(out); // σε DEV θα δεις { token }
});

exports.confirmRecovery = asyncHandler(async (req, res) => {
    await auth.confirmRecovery(req.body);
    res.json({ ok: true });
});
