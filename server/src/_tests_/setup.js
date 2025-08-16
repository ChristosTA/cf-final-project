// server/src/_tests_/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    // env ΠΡΙΝ φορτώσουμε το app
    process.env.MONGODB_URI = uri;
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
    process.env.COOKIE_SECURE = 'false';
    process.env.DISABLE_CSRF = 'true'; // skip CSRF checks στα tests

    await mongoose.connect(uri, { dbName: 'testdb' });

    // φορτώνουμε το express app που κάνει export
    const app = require('../index');
    if (typeof app !== 'function') throw new Error('Express app export missing from src/schemas.js');
    global.__app = app;
});

afterEach(async () => {
    const { collections } = mongoose.connection;
    await Promise.all(Object.values(collections).map(c => c.deleteMany({})));
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
});
