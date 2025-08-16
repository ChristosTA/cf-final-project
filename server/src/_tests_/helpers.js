const request = require('supertest');
const User = require('../models/user.Model');

async function register(agent, { email, username, name, password='secret123' }) {
    return agent.post('/api/auth/register').send({ email, username, name, password }).expect(201);
}
async function loginCookie(agent, email, password='secret123') {
    return agent.post('/api/auth/login-cookie').send({ email, password }).expect(200);
}
async function makeAdmin(email) {
    const u = await User.findOne({ email }); if (!u) throw new Error('admin not found');
    await User.updateOne({ _id: u._id }, { $addToSet: { roles: 'ADMIN' } });
    return u;
}
async function makeSeller(email) {
    const u = await User.findOne({ email }); if (!u) throw new Error('seller not found');
    await User.updateOne({ _id: u._id }, { $addToSet: { roles: 'SELLER' } });
    return u;
}

module.exports = { register, loginCookie, makeAdmin, makeSeller };
