const request = require('supertest');
const mongoose = require('mongoose');
// Set the environment to test before requiring the app
process.env.MONGODB_URI = 'mongodb://localhost:27017/eduplanai_test';
const app = require('../../index'); // Import the app
const User = require('../../models/User');

beforeAll(async () => {
    // Wait for initial connection to be established via app require
    // If app connection logic is async and not awaited on import, we might need to wait.
    // However, mongoose connection is global. We can just wait for it to be ready.
    // Wait for mongoose connection initiated by app require to be fully ready
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connection.asPromise();
    }
});

afterEach(async () => {
    // Clean up database between tests
    if (mongoose.connection.readyState !== 0) {
        const collections = Object.keys(mongoose.connection.collections);
        for (const collectionName of collections) {
            const collection = mongoose.connection.collections[collectionName];
            await collection.deleteMany({});
        }
    }
});

afterAll(async () => {
    // Close connection after all tests
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
});

describe('Auth API Integration Tests', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
        });

        it('should not register a user with existing email', async () => {
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            // Second registration
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User 2',
                    email: 'test@example.com',
                    password: 'password456'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Email already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Register a user before login tests
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should not login with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });
    });
});
