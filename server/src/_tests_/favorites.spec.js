const request = require('supertest');
const User = require('../models/user.Model');
const Listing = require('../models/listing.Model');

async function register(agent, u) { return agent.post('/api/auth/register').send(u).expect(201); }
async function loginCookie(agent, email, password='secret123') { return agent.post('/api/auth/login-cookie').send({ email, password }).expect(200); }

describe('Favorites', () => {
    let buyer, seller, sellerU, listingId;

    beforeAll(async () => {
        buyer = request.agent(global.__app);
        seller = request.agent(global.__app);

        await register(buyer,  { email:'b@demo.dev', username:'buyer01',  name:'Buyer One',  password:'secret123' });
        await register(seller, { email:'s@demo.dev', username:'seller10', name:'Seller Ten', password:'secret123' });

        await loginCookie(buyer, 'b@demo.dev');
        await loginCookie(seller, 's@demo.dev');

        sellerU = await User.findOne({ email:'s@demo.dev' });
        await User.updateOne({ _id: sellerU._id }, { $addToSet: { roles: 'SELLER' } });

        const l = await Listing.create({
            sellerId: sellerU._id,
            title:'Basic Tee',
            description:'plain tee for tests',
            price: 9.9,
            condition:'GOOD',
            tags:['tshirt','basic']
        });
        listingId = String(l._id);
    });

    it('buyer can add and remove favorite; seller cannot favorite own listing', async () => {
        // Στο repo σου ο add favorite είναι με path param
        await buyer.post(`/api/favorites/${listingId}`).expect(201);

        await buyer.delete(`/api/favorites/${listingId}`).expect(204);

        await seller.post(`/api/favorites/${listingId}`).expect(400); // ή 403, ανάλογα το service
    });
});
