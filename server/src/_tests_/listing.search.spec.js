// server/src/_tests_/listing.search.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const Listing = require('../models/listing.Model');

describe('Listings search', () => {
    it('filter by seller returns results', async () => {
        expect(global.__app).toBeDefined();

        const sellerId = new mongoose.Types.ObjectId();

        await Listing.create([
            { sellerId, title:'Hoodie Black M', description:'', price:49.9, condition:'NEW',  tags:['hoodie','black','M','UrbanX'] },
            { sellerId, title:'Hoodie Blue L',  description:'', price:39.9, condition:'GOOD', tags:['hoodie','blue','L','UrbanX'] },
        ]);

        const res = await request(global.__app)
            .get('/api/listings')
            .query({ seller: sellerId.toString() }) // page/limit optional
            .expect(200);

        const items = res.body.results || res.body.items || res.body.data || [];
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThanOrEqual(2);
    });
});
