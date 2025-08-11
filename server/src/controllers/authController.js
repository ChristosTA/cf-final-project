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
