const asyncHandler = require('../middlewares/asyncHandler');
const users = require('../services/userService');

exports.list = asyncHandler(async (req, res) => {
    res.json({ items: await users.listUsers() });
});

exports.updateRoles = asyncHandler(async (req, res) => {
    res.json(await users.updateRoles(req.params.id, req.body.roles));
});

exports.get = asyncHandler(async (req, res) => {
    const user = await users.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
});

exports.remove = asyncHandler(async (req, res) => {
    await users.removeUser(req.params.id);
    res.json({ ok: true });
});


