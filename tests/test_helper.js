const request = require('supertest');
const app = require('../index');
const User = require('../models/User');

const setupUser = async () => {
    const userData = {
        name: 'Test Setup User',
        email: 'setup@example.com',
        password: 'password123'
    };

    // Check if user exists to avoid duplicate key error if not cleaned up properly
    let user = await User.findOne({ email: userData.email });
    if (!user) {
        // We use the /register endpoint to ensure hashing and everything is correct
        await request(app)
            .post('/api/auth/register')
            .send(userData);

        // Login to get token
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        return res.body.token;
    } else {
        // Login to get token
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        return res.body.token;
    }
};

module.exports = {
    setupUser
};
