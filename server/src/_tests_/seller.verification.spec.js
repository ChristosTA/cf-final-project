const request = require('supertest');
const User = require('../models/user.Model');

async function register(agent, u) {
    return agent.post('/api/auth/register').send(u).expect(201);
}
async function loginCookie(agent, email, password='secret123') {
    return agent.post('/api/auth/login-cookie').send({ email, password }).expect(200);
}
async function promoteAdminBeforeLogin(email) {
    const u = await User.findOne({ email });
    if (u) await User.updateOne({ _id: u._id }, { $addToSet: { roles: 'ADMIN' } });
}

describe('Seller verification & billing flow', () => {
    let user, admin;

    beforeAll(() => {
        user = request.agent(global.__app);
        admin = request.agent(global.__app);
    });

    it('user submits seller profile -> admin approves -> user can set billing', async () => {
        // κάνε τον admin ΠΡΙΝ το login ώστε να γραφτεί στο JWT
        await register(admin, { email:'admin@demo.dev', username:'admin01', name:'Admin One', password:'secret123' });
        await promoteAdminBeforeLogin('admin@demo.dev');
        await loginCookie(admin, 'admin@demo.dev');

        await register(user,  { email:'u1@demo.dev', username:'user01',  name:'User One',  password:'secret123' });
        await loginCookie(user,  'u1@demo.dev');

        // σωστό route + σωστά keys (postalCode) + shopName
        await user.put('/api/sellers/me/profile').send({
            shopName: 'User One Store',
            legalName: 'User One Sole Trader',
            phone: '+302101234567',
            addresses: [{ line1: 'Dionysiou 10', city: 'Athens', country: 'GR', postalCode: '11521' }]
        }).expect(200);

        const dbUser = await User.findOne({ email: 'u1@demo.dev' }).lean();
        await admin.post(`/api/admin/sellers/${dbUser._id}/approve`).send({ note: 'ok' }).expect(200);

        await user.put('/api/sellers/me/billing').send({
            legalName: 'User One Sole Trader',
            taxId: 'EL123456789',
            address: { line1: 'Kifisias 1', city: 'Athens', country: 'GR', postalCode: '11526' }
        }).expect(200);
    });

    it('reject blocks billing until re-approved', async () => {
        const u2 = request.agent(global.__app);
        await register(u2, { email:'u2@demo.dev', username:'user02', name:'User Two', password:'secret123' });
        await loginCookie(u2, 'u2@demo.dev');

        await u2.put('/api/sellers/me/profile').send({
            shopName:'User Two Store',
            legalName:'User Two',
            phone:'+302109876543',
            addresses: [{ line1:'Test 1', city:'Athens', country:'GR', postalCode:'11521' }]
        }).expect(200);

        const dbUser2 = await User.findOne({ email:'u2@demo.dev' }).lean();

        // ο admin είναι ήδη logged-in με ρόλο ADMIN από το προηγούμενο test
        await admin.post(`/api/admin/sellers/${dbUser2._id}/reject`).send({ note: 'missing docs' }).expect(200);

        await u2.put('/api/sellers/me/billing').send({
            legalName:'User Two', taxId:'EL000000000',
            address:{ line1:'-', city:'Athens', country:'GR', postalCode:'11521' }
        }).expect(403);
    });
});
