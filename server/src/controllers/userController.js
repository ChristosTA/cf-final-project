// src/controllers/userController.js
const asyncHandler = require('../middlewares/asyncHandler');
const users = require('../services/userService');

exports.list = asyncHandler(async (req, res) => {
    res.json({ items: await users.listUsers() });
});

exports.get = asyncHandler(async (req, res) => {
    const user = await users.getUser(req.params.id); // id έχει γίνει ObjectId από middleware
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
});

exports.updateRoles = asyncHandler(async (req, res) => {
    const result = await users.updateRoles(req.params.id, req.body.roles, req.user);
    res.json(result);
});

exports.remove = asyncHandler(async (req, res) => {
    await users.removeUser(req.params.id, req.user);
    res.json({ ok: true });
});

exports.me = asyncHandler(async (req, res) => {
    const me = await users.getMe(req.user.id);
    res.json(me);
});

exports.updateMe = asyncHandler(async (req, res) => {
    const me = await users.updateMe(req.user.id, req.body);
    res.json(me);
});