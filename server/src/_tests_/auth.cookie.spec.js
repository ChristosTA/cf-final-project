// server/src/_tests_/auth.cookie.spec.js
const request = require('supertest');

describe('Auth cookies flow', () => {
    it('register -> login-cookie -> me -> refresh-cookie -> logout-cookie', async () => {
        expect(global.__app).toBeDefined(); // sanity
        const agent = request.agent(global.__app);

        await agent.post('/api/auth/register')
            .send({ email: 'user1@demo.dev', username: 'user1', name: 'User One', password: 'secret123' })
            .expect(201);

        const login = await agent.post('/api/auth/login-cookie')
            .send({ email: 'user1@demo.dev', password: 'secret123' })
            .expect(200);

        expect(login.headers['set-cookie']).toBeDefined();

        await agent.get('/api/me').expect(200);
        await agent.post('/api/auth/refresh-cookie').expect(200);
        await agent.post('/api/auth/logout-cookie').expect(204);
    });
});
