const request = require('supertest');
const User = require('../models/user.Model');
const Listing = require('../models/listing.Model');

async function register(agent, u) { return agent.post('/api/auth/register').send(u).expect(201); }
async function loginCookie(agent, email, password='secret123') { return agent.post('/api/auth/login-cookie').send({ email, password }).expect(200); }

async function promoteSellerBeforeLogin(email) {
    const u = await User.findOne({ email });
    if (u) await User.updateOne({ _id: u._id }, { $addToSet: { roles: 'SELLER' } });
    return u;
}

describe('Listings CRUD + permissions + id resolution', () => {
    let s1Agent, s2Agent, adminAgent, s1, s2;

    beforeAll(async () => {
        s1Agent = request.agent(global.__app);
        s2Agent = request.agent(global.__app);
        adminAgent = request.agent(global.__app);

        await register(s1Agent,   { email:'s1@demo.dev',   username:'seller01', name:'Seller One', password:'secret123' });
        await register(s2Agent,   { email:'s2@demo.dev',   username:'seller02', name:'Seller Two', password:'secret123' });
        await register(adminAgent,{ email:'admin@demo.dev', username:'admin02', name:'Admin Two',  password:'secret123' });

        s1 = await promoteSellerBeforeLogin('s1@demo.dev');
        s2 = await promoteSellerBeforeLogin('s2@demo.dev');

        await loginCookie(s1Agent, 's1@demo.dev');
        await loginCookie(s2Agent, 's2@demo.dev');
        await loginCookie(adminAgent, 'admin@demo.dev');

        const admin = await User.findOne({ email:'admin@demo.dev' });
        await User.updateOne({ _id: admin._id }, { $addToSet: { roles:'ADMIN' } });
        // re-login για να μπει ο ρόλος στο JWT
        await loginCookie(adminAgent, 'admin@demo.dev');
    });

    it('seller can create; other seller cannot edit; admin can edit', async () => {
        const create = await s1Agent.post('/api/listings').send({
            title: 'UrbanX Hoodie Black M',
            description: 'A comfy hoodie for tests',
            price: 49.9,
            condition: 'NEW',
            tags: ['hoodie','UrbanX','M','black']
        }).expect(201);

        const { _id, id: uuid } = create.body;

        await s2Agent.put(`/api/listings/${uuid}`).send({ price: 39.9 }).expect(403);

        await adminAgent.put(`/api/listings/${uuid}`).send({ price: 39.9 }).expect(200);

        const doc = await Listing.findById(_id).lean();
        const res = await s1Agent.get(`/api/listings/${doc.serial}`).expect(200);
        expect(res.body.price).toBe(39.9);
    });
});
