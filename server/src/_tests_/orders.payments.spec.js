// server/src/_tests_/orders.payments.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const Listing = require('../models/listing.Model');
const User = require('../models/user.Model');

async function register(agent, u) {
    return agent.post('/api/auth/register').send(u).expect(201);
}
async function loginCookie(agent, email, password='secret123') {
    return agent.post('/api/auth/login-cookie').send({ email, password }).expect(200);
}

describe('Orders payments flow', () => {
    let buyer, admin;
    let orderId;

    beforeAll(() => {
        expect(global.__app).toBeDefined();
        buyer = request.agent(global.__app);
        admin = request.agent(global.__app);
    });

    beforeAll(async () => {
        // 1) admin + buyer
        await register(admin, { email:'admin@demo.dev', username:'admin', name:'Admin', password:'secret123' });
        await register(buyer, { email:'buyer@demo.dev', username:'buyer', name:'Buyer', password:'secret123' });

        // κάνε ADMIN τον admin
        const adminUser = await User.findOne({ email:'admin@demo.dev' });
        await User.updateOne({ _id: adminUser._id }, { $addToSet: { roles: 'ADMIN' } });

        // 2) seller + listing κατευθείαν στη DB
        const seller = await User.create({
            email:'seller1@demo.dev',
            username:'seller1',
            name:'Seller',
            passwordHash:'dummy',
            roles:['SELLER']
        });

        const l = await Listing.create({
            sellerId: seller._id,
            title:'Test Tee',
            description:'',
            price:19.9,
            condition:'NEW',
            tags:['tshirt','black','M','UrbanX'],
        });

        // 3) logins
        await loginCookie(buyer, 'buyer@demo.dev');
        await loginCookie(admin, 'admin@demo.dev');

        // 4) create order (schema δέχεται listingId ή listing)
        const created = await buyer.post('/api/orders')
            .send({ listingId: String(l._id) })
            .expect(201);

        orderId = String(created.body._id || created.body.id);
    });

    it('authorize by buyer -> capture by admin -> refund partial by admin', async () => {
        await buyer.post(`/api/orders/${orderId}/payments/authorize`).expect(201);
        await admin.post(`/api/orders/${orderId}/payments/capture`).expect(200);
        await admin.post(`/api/orders/${orderId}/payments/refund`).send({ amount: 5 }).expect(200);
    });
});
